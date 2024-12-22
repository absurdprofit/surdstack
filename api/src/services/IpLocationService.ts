interface IpLocationSuccess {
  status: 'success';
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

interface IpLocationFail {
  status: 'fail';
  message: string;
  query: string;
}

type IpLocation = IpLocationSuccess | IpLocationFail;

export class IpLocationService {
  public async locate(ip: string): Promise<IpLocation> {
    return await fetch(`http://ip-api.com/json/${ip}`).then(response => response.json());
  }
}