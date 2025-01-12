import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { disconnect } from 'mongoose';

describe('UrlController (e2e)', () => {
  let app: INestApplication;
  let shortUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 10000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnect();
  });

  it('/url/shorten (POST) should create a short URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ originalUrl: 'https://google.com', method: 'GET' })
      .expect(201);

    shortUrl = response.body.shortUrl;
    expect(typeof shortUrl).toBe('string');
    expect(shortUrl).toHaveLength(6);
  });

  it('/url/:shortUrl (GET) should redirect to the original URL', async () => {
    const response = await request(app.getHttpServer()).get(`/url/${shortUrl}`).expect(302);

    expect(response.header.location).toBe('https://google.com');
  });

  it('/url/info/:shortUrl (GET) should return URL info', async () => {
    const response = await request(app.getHttpServer()).get(`/url/info/${shortUrl}`).expect(200);

    expect(response.body).toHaveProperty('shortUrl', shortUrl);
    expect(response.body).toHaveProperty('originalUrl', 'https://google.com');
    expect(response.body).toHaveProperty('expiresAt');
    expect(response.body).toHaveProperty('method', 'GET');
  });

  it('/url/analytics/:shortUrl (GET) should return URL analytics', async () => {
    const response = await request(app.getHttpServer()).get(`/url/analytics/${shortUrl}`).expect(200);

    expect(response.body).toHaveProperty('clickCount');
    expect(response.body).toHaveProperty('recentClicks');
  });

  it('/url/delete/:shortUrl (DELETE) should delete the URL', async () => {
    await request(app.getHttpServer()).delete(`/url/delete/${shortUrl}`).expect(200);
  });
});
