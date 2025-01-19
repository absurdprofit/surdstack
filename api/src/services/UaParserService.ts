import { UAParser } from 'ua-parser-js';

export class UaParserService {
  public parse(ua: string) {
    return UAParser(ua);
  }
}