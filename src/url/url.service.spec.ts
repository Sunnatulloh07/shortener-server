import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { getModelToken } from '@nestjs/mongoose';
import { Url } from './schema/url.schema';
import { Model } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked data' }),
  }),
) as jest.Mock;

describe('UrlService', () => {
  let service: UrlService;
  let model: Model<Url>;

  const exec = { exec: jest.fn().mockResolvedValue([]) };
  const urlRepositoryFactory = {
    findOne: () => exec,
    find: jest.fn().mockReturnValue(exec),
    deleteOne: () => exec,
    constructor: jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    })),
    create: jest.fn().mockResolvedValue({
      originalUrl: 'http://example.com',
      shortUrl: 'testAlias',
      createdAt: new Date(),
      expiresAt: null,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          useFactory: () => urlRepositoryFactory,
          provide: getModelToken(Url.name),
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    model = module.get(getModelToken(Url.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new short URL', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

    const alias = 'testAlias';
    const url = 'http://example.com';
    const result = await service.createShortUrl({
      originalUrl: url,
      alias,
      expiresAt: new Date(),
      method: 'GET',
    });
    expect(result.shortUrl).toBe(alias);
    expect(result.originalUrl).toBe(url);
  });

  it('should get all urls', async () => {
    const urls = await service.getAllUrlsService();
    expect(model.find).toHaveBeenCalledWith({});
    expect(urls).toEqual([]);
  });

  it('should throw BadRequestException if alias is already taken', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({ shortUrl: 'existingAlias' });

    const alias = 'existingAlias';
    const url = 'http://example.com';
    await expect(
      service.createShortUrl({
        originalUrl: url,
        alias,
        expiresAt: new Date(),
        method: 'GET',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if the short URL is not found', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

    const shortUrl = 'nonexistent';
    await expect(service.getOriginalUrl(shortUrl, '127.0.0.1')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if the short URL has expired', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({ expiresAt: new Date(Date.now() - 1000) });

    const shortUrl = 'expired';
    await expect(service.getOriginalUrl(shortUrl, '127.0.0.1')).rejects.toThrow(NotFoundException);
  });

  it('get original url working', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({
      originalUrl: 'http://example.com',
      shortUrl: 'testAlias',
      createdAt: new Date(),
      expiresAt: null,
      clickCount: 0,
      clicks: [],
      save: jest.fn().mockResolvedValue({}),
    });
    const result = await service.getOriginalUrl('testAlias', '127.0.0.1');
    expect(result).toEqual('http://example.com');
    expect(model.findOne).toHaveBeenCalledWith({ shortUrl: 'testAlias' });
  });

  it('get original url not found', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
    await expect(service.getOriginalUrl('nonexistent', '127.0.0.1')).rejects.toThrow(NotFoundException);
  });

  it('get url info working', async () => {
    const mockDate = new Date();
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({
      shortUrl: 'testAlias',
      originalUrl: 'http://example.com',
      createdAt: mockDate,
      expiresAt: null,
      clickCount: 0,
      clicks: [],
    });
    const result = await service.getUrlInfo('testAlias');
    expect(result).toEqual({
      shortUrl: 'testAlias',
      originalUrl: 'http://example.com',
      createdAt: mockDate,
      expiresAt: null,
      clickCount: 0,
      clicks: [],
    });
    expect(model.findOne).toHaveBeenCalledWith({ shortUrl: 'testAlias' });
  });

  it('get url info not found', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
    await expect(service.getUrlInfo('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('get analytics working', async () => {
    const mockDate = new Date();
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({
      shortUrl: 'testAlias',
      originalUrl: 'http://example.com',
      createdAt: mockDate,
      expiresAt: null,
      clickCount: 0,
      clicks: [],
    });
    const result = await service.getAnalytics('testAlias');
    expect(result).toEqual({
      clickCount: 0,
      recentClicks: [],
    });
    expect(model.findOne).toHaveBeenCalledWith({ shortUrl: 'testAlias' });
  });

  it('get analytics not found', async () => {
    jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);
    await expect(service.getAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('delete url working', async () => {
    jest.spyOn(model, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1, acknowledged: true });
    await service.deleteUrl('testAlias');
    expect(model.deleteOne).toHaveBeenCalledWith({ shortUrl: 'testAlias' });
  });

  it('delete url not found', async () => {
    jest.spyOn(model, 'deleteOne').mockResolvedValueOnce({ deletedCount: 0, acknowledged: true });
    await expect(service.deleteUrl('nonexistent')).rejects.toThrow(NotFoundException);
  });
});
