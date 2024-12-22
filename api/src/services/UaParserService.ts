import { UAParser } from 'ua-parser';

export class UaParserService {
  public parse(ua: string) {
    return UAParser(ua);
  }
}