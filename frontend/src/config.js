
export class Configuration {
  constructor(configMap) {
    this.networkTimeout = configMap["networkTimeout"] || 5000;
    this.apiRoot = configMap["apiRoot"];
  }
}

let environment = process.env.ENVIRONMENT || "development";
export const Config = new Configuration(require(`../config/${environment}.json`));
