import express from 'express';
import routers from './routers';
import config from './config';
import log4js, { Configuration } from 'log4js';
import mongoose, { ConnectOptions } from 'mongoose';
import Consul from 'consul';

type EnvType = 'dev' | 'prod';

let env: EnvType = 'dev';
if (String(process.env.NODE_ENV).trim() === 'dev') {
  env = 'dev';
}

const consulConfig = config.consul.server[env];
const consulServer = new Consul({
  host: consulConfig.host,
  port: String(consulConfig.port),
});

const prefix = `config/${config.consul.service.name}`;

type ConsulResult = {
  Value: string | number,
};

const getConsulValue = async (key: string) => {
  try {
    const result = await consulServer.kv.get<ConsulResult>(`${prefix}/${key}`);
    if (!result || !result.Value) {
      throw new Error(`No value found for key: ${prefix}/${key}`);
    }
    return result.Value;
  } catch (error) {
    log4js.getLogger().error(`Error fetching key ${prefix}/${key} from Consul:`, error);
    throw error;
  }
};

export default async () => {
  const app = express();

  log4js.configure(config.log4js as Configuration);

  app.disable('etag');
  app.use(express.json({ limit: '1mb' }));

  app.use((req, _, next) => {
    const dateReviver = (_: string, value: unknown) => {
      if (value && typeof value === 'string') {
        const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (dateRegex.test(value)) {
          return new Date(value);
        }
      }
      return value;
    };
    req.body = JSON.parse(JSON.stringify(req.body), dateReviver);
    next();
  });

  app.use('/', routers);

  try {
    const port = parseInt(await getConsulValue(`${env}/port`) as string, 10);
    const address = await getConsulValue(`${env}/address`) as string;

    app.listen(port, address, () => {
      log4js.getLogger().info(`Example app listening on port ${address}:${port}`);
    });

    const mongoAddress = await getConsulValue(`${env}/mongo.address`) as string;
    await mongoose.connect(mongoAddress, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: 30000,
    } as ConnectOptions);

    return app;
  } catch (error) {
    log4js.getLogger().error('Failed to start application:', error);
    process.exit(1);
  }
};
