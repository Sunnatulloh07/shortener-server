import { Controller, Post, Body, Get, Param, Delete, Req, Redirect, NotFoundException, Query } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlCreateDto } from './dto/url.create.dto';
import { Request } from 'express';
import { URL_NOT_FOUND } from './constants/url.constants';
import { Logger } from '@nestjs/common';

@Controller('url')
export class UrlController {
  private readonly logger = new Logger(UrlController.name);
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  async createShortUrl(@Body() urlCreateDto: UrlCreateDto) {
    const { shortUrl } = await this.urlService.createShortUrl(urlCreateDto);
    return { shortUrl };
  }

  @Get(':shortUrl')
  @Redirect()
  async redirectToOriginal(@Param('shortUrl') shortUrl: string, @Req() req: Request) {
    const ip = req.ip;
    const originalUrl = await this.urlService.getOriginalUrl(shortUrl, ip);
    return { url: originalUrl };
  }

  @Get('short-urls/all')
  async getShortUrls() {
    const urls = await this.urlService.getAllUrlsService();
    return urls;
  }

  @Get('info/:shortUrl')
  async getUrlInfo(@Param('shortUrl') shortUrl: string) {
    const url = await this.urlService.getUrlInfo(shortUrl);
    if (!url) throw new NotFoundException(URL_NOT_FOUND);
    return url;
  }

  @Get('analytics/:shortUrl')
  async getAnalytics(@Param('shortUrl') shortUrl: string) {
    const url = await this.urlService.getAnalytics(shortUrl);
    if (!url) throw new NotFoundException(URL_NOT_FOUND);
    return url;
  }

  @Delete('delete/:shortUrl')
  async deleteUrl(@Param('shortUrl') shortUrl: string) {
    return this.urlService.deleteUrl(shortUrl);
  }
}
