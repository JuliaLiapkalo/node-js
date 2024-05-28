import bodyParser from 'body-parser';
import express from 'express';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { saveComment, listComments, numberCommentsOfFilms } from '../../controllers/comments';
import { ObjectId } from 'mongodb';
import Comment from 'src/model/comments';
import nock from 'nock';
import log4js from "log4js";
import mongoSetup from "../mongoSetup";

const { expect } = chai;

chai.use(chaiHttp);
chai.should();

const sandbox = sinon.createSandbox();

const app = express();

app.use(bodyParser.json({ limit: '1mb' }));
app.post('', saveComment);
app.get('', listComments);
app.post('/_count', numberCommentsOfFilms);

const comment1 = new Comment({
    _id: new ObjectId().toString(),
    filmId: 1,
    nik: 'Test nik 1',
    text: 'Test text 1',
});

const comment2 = new Comment({
    _id: new ObjectId().toString(),
    filmId: 2,
    nik: 'Test nik 2',
    text: 'Test text 2',
});

const comment3 = new Comment({
    _id: new ObjectId().toString(),
    filmId: 2,
    nik: 'Test nik 3',
    text: 'Test text 3',
});

describe('Comments controller', function () {

    before(async () => {
        await mongoSetup;
        await comment1.save();
        await comment2.save();
        await comment3.save();
    });

    afterEach(() => {
        nock.cleanAll();
        sandbox.restore();
    });


    it('should save comment to bd', async (done) => {
        const filmId = 4;

        const commentData = {
            filmId,
            nik: 'Test nik 4',
            text: 'Test text 4',
        };

        nock('http://localhost:8086')
            .get('/api/v1/films/4')
            .reply(200, { id: 4, title: 'Test Film' });

        chai.request(app)
            .post('')
            .send(commentData)
            .end(async (err, res) => {
                if (err) {
                    log4js.getLogger().error('Error in chai request:', err);
                    return done(err);
                }

                try {
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('id');

                    const id = res.body.id;
                    const comment = await Comment.findById(id);

                    expect(comment).to.exist;
                    expect(comment?.nik).to.equal(commentData.nik);
                    expect(comment?.filmId).to.equal(commentData.filmId);
                    expect(comment?.text).to.eql(commentData.text);
                    expect(comment?.createdAt).to.exist;

                    done();
                } catch (assertionError) {
                    log4js.getLogger().error('Error in assertionError', err);
                    done(assertionError);
                }
            });
    });

    it('invalid filmId while save comment to bd', (done) => {
            const invalidFilmId = 5;

            const commentData = {
                invalidFilmId,
                nik: '',
                text: 'Test text 4',
            };

            nock('http://localhost:8086')
                .get(`/api/v1/films/${invalidFilmId}`)
                .reply(500);

            chai.request(app)
                .post('')
                .send(commentData)
                .end((err, res) => {
                    if (err) {
                        log4js.getLogger().error('Error in chai request:', err);
                        return done(err);
                    }

                    try {
                        expect(res).to.have.status(500);
                        expect(res.body).to.have.property('message').that.is.a('string').that.includes('Failed to create comment: Error: Invalid film ID');
                        done();
                    } catch (assertionError) {
                        log4js.getLogger().error('Error in assertionError', assertionError);
                        done(assertionError);
                    }
                });
    });

    it('should return list comments for a film', async () => {
        const filmId = '1';
        const from = '0';
        const size = '10';

        const res = await chai
            .request(app)
            .get(`?id=${filmId}&from=${from}&size=${size}`);

        expect(res).to.have.status(200);

        expect(res.body).to.be.an('array');

    });

    it('should handle invalid filmId', async () => {
        const invalidFilmId = 'invalid';

        const res = await chai
            .request(app)
            .get(`?id=${invalidFilmId}`);

        expect(res).to.have.status(500);
    });

    it('should return the number of comments for each film', (done) => {
        const filmIds = [1, 2];
        const expectedResult = {
            1: 1,
            2: 2,
        };

        chai.request(app)
            .post('/_count')
            .send({filmIds})
            .end((_, res) => {
                res.should.have.status(200);
                expect(res.body).to.deep.equal(expectedResult);
                done();
            });
    });

});