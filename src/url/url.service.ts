import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Url } from './schema/url.schema';
import { randomBytes } from 'crypto';
import { UrlCreateDto } from './dto/url.create.dto';
import { URL_NOT_FOUND, URL_ALIAS_ALREADY_TAKEN, URL_EXPIRED } from './constants/url.constants';

@Injectable()
export class UrlService {
  constructor(@InjectModel(Url.name) private urlModel: Model<Url>) {}

  async createShortUrl(urlCreateDto: UrlCreateDto): Promise<Url> {
    const { originalUrl, alias, expiresAt, method } = urlCreateDto;
    if (alias) {
      const existingUrl = await this.urlModel.findOne({ shortUrl: alias });
      if (existingUrl) {
        throw new BadRequestException(URL_ALIAS_ALREADY_TAKEN);
      }
    }

    const shortUrl = alias || randomBytes(3).toString('hex');
    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt date');
    }

    const url = await this.urlModel.create({
      originalUrl,
      shortUrl,
      createdAt: new Date(),
      expiresAt: parsedExpiresAt,
      method,
    });
    return url;
  }

  async getAllUrlsService(): Promise<Url[]> {
    const urls = await this.urlModel.find({}).exec();
    return urls;
  }

  async getOriginalUrl(shortUrl: string, ip: string): Promise<string> {
    const url = await this.urlModel.findOne({ shortUrl });
    if (!url) {
      throw new NotFoundException(URL_NOT_FOUND);
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new NotFoundException(URL_EXPIRED);
    }

    url.clickCount += 1;
    url.clicks.push({ date: new Date(), ip });
    await url.save();

    return url.originalUrl;
  }

  async getUrlInfo(shortUrl: string): Promise<Url> {
    const url = await this.urlModel.findOne({ shortUrl });
    if (!url) {
      throw new NotFoundException(URL_NOT_FOUND);
    }
    return url;
  }

  async getAnalytics(shortUrl: string): Promise<{
    clickCount: number;
    recentClicks: { date: Date; ip: string }[];
  }> {
    const url = await this.urlModel.findOne({ shortUrl });
    if (!url) {
      throw new NotFoundException(URL_NOT_FOUND);
    }

    return {
      clickCount: url.clickCount,
      recentClicks: url.clicks.slice(-5).reverse(),
    };
  }

  async deleteUrl(shortUrl: string): Promise<void> {
    const result = await this.urlModel.deleteOne({ shortUrl });
    if (result.deletedCount === 0) {
      throw new NotFoundException(URL_NOT_FOUND);
    }
  }
}
