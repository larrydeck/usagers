import axios from 'axios'
import { exec } from 'child_process'

const serviceUrl = '.share.worldcat.org/idaas/scim/v2';
const DEFAULT_HTTP_CLIENT_TIMEOUT = 30000;

import UserError from './UserError';

export default class User {
  constructor(doc, { eTag = null, proxy = null, httpClientTimeout = DEFAULT_HTTP_CLIENT_TIMEOUT } = {}) {

    this.doc = doc;
    if (eTag) {
      this.eTag = eTag;
    }
    this.proxy = proxy;
    this.httpClientTimeout = httpClientTimeout;
  }

  getETag() {
    return this.eTag;
  }

  getID() {
    return this.doc.id;
  }

  getFamilyName() {
    return this.doc.name.familyName;
  }

  setFamilyName(familyName) {
    this.doc.name.familyName = familyName;
  }

  getGivenName() {
    return this.doc.name.givenName;
  }

  setGivenName(givenName) {
    this.doc.name.givenName = givenName;
  }

  getMiddleName() {
    return this.doc.name.middleName;
  }

  setMiddleName(middleName) {
    this.doc.name.middleName = middleName;
  }

  getEmail() {
    let email = "";
    if (this.doc.email === undefined) {
      email = "";
      if (this.doc.emails === undefined) {
        email = "";
      } else if (this.doc.emails.length > 1) {
        let primaryEmail = this.getEmails().filter(email => email.primary === true);
        email = primaryEmail[0].value;
      } else {
        email = this.doc.emails[0].value;
      }
    } else {
      email = this.doc.email;
    }

    return email;
  }

  addEmail(email, type, primary = false) {
    if (this.doc.emails === undefined) {
      this.doc.emails = [];
    }
    let newEmail = {
      "value": email,
      "type": type,
      "primary": primary
    }
    this.doc.emails.push(newEmail);

  }

  setEmail(number, fields) {
    this.doc.emails[number].value = fields['email'];
    if (fields['type']) {
      this.doc.emails[number].type = fields['type'];
    }
    if (fields['primary']) {
      this.doc.emails[number].primary = fields['primary'];
    }
  }

  getOclcPPID() {
    if (this.doc.oclcPPID) {
      return this.doc.oclcPPID;
    } else {
      return this.doc['urn:mace:oclc.org:eidm:schema:persona:persona:20180305'].oclcPPID;
    }
  }

  getInstitutionId() {
    if (this.doc.institutionId) {
      return this.doc.institutionId;
    } else {
      return this.doc['urn:mace:oclc.org:eidm:schema:persona:persona:20180305'].institutionId;
    }
  }

  getOclcNamespace() {
    if (this.doc.oclcNamespace) {
      return this.doc.oclcNamespace;
    } else {
      return this.doc['urn:mace:oclc.org:eidm:schema:persona:persona:20180305'].oclcNamespace;
    }

  }

  getExternalID() {
    return this.doc.externalId;
  }

  getUserName() {
    return this.doc.userName;
  }

  getEmails() {
    if (this.doc.emails === undefined) {
      let emails = [];
      return emails;
    } else {
      return this.doc.emails;
    }
  }

  getAddresses() {
    return this.doc.addresses;
  }

  addAddress(streetAddress, locality, region, postalCode, type, primary = false) {
    if (this.doc.addresses === undefined) {
      this.doc.addresses = [];
    }
    let newAddress = {
      "streetAddress": streetAddress,
      "locality": locality,
      "region": region,
      "postalCode": postalCode,
      "type": type,
      "primary": primary
    }
    this.doc.addresses.push(newAddress);
  }

  setAddress(number, fields) {
    if (fields['streetAddress']) {
      this.doc.addresses[number].streetAddress = fields['streetAddress'];
    }
    if (fields['locality']) {
      this.doc.addresses[number].locality = fields['locality'];
    }
    if (fields['region']) {
      this.doc.addresses[number].region = fields['region'];
    }
    if (fields['postalCode']) {
      this.doc.addresses[number].postalCode = fields['postalCode'];
    }

    if (fields['type']) {
      this.doc.addresses[number].type = fields['type'];
    }

    if (fields['primary']) {
      this.doc.addresses[number].primary = fields['primary'];
    }
  }

  setPassword(password) {
    this.doc["urn:mace:oclc.org:eidm:schema:persona:persona:20180305"].oclcPassword = password;
  }

  getCircInfo() {
    return this.doc["urn:mace:oclc.org:eidm:schema:persona:wmscircpatroninfo:20180101"].circulationInfo;
  }

  getILLInfo() {
    return this.doc["urn:mace:oclc.org:eidm:schema:persona:wsillinfo:20180101"].illInfo;
  }

  getCorrelationInfo() {
    return this.doc["urn:mace:oclc.org:eidm:schema:persona:correlationinfo:20180101"].correlationInfo;
  }

  static find(id, institution, accessToken, { proxy = null, httpClientTimeout = DEFAULT_HTTP_CLIENT_TIMEOUT }) {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'User-Agent': 'node.js KAC client'
      }
    };

    let url = 'https://' + institution + serviceUrl + '/Users/' + id;
    return new Promise(function (resolve, reject) {
      axios.get(url, config)
        .then(response => {
          // parse out the User
          resolve(new User(response.data, { eTag: response.headers['etag'], proxy, httpClientTimeout }));
        })
        .catch(error => {
          reject(new UserError(error));
        });
    });
  }

  static add(fields, institution, accessToken, { proxy = null, httpClientTimeout = DEFAULT_HTTP_CLIENT_TIMEOUT } = {}) {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'User-Agent': 'node.js KAC client',
        'Content-Type': 'application/scim+json'
      }
    };

    let url = 'https://' + institution + serviceUrl + '/Users';
    return new Promise(function (resolve, reject) {
      let data = {
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:User",
          "urn:mace:oclc.org:eidm:schema:persona:correlationinfo:20180101",
          "urn:mace:oclc.org:eidm:schema:persona:persona:20180305",
          "urn:mace:oclc.org:eidm:schema:persona:wmscircpatroninfo:20180101",
          "urn:mace:oclc.org:eidm:schema:persona:wsillinfo:20180101"
        ],
        "name": {
          "familyName": fields['familyName'],
          "givenName": fields['givenName'],
          "middleName": fields['middleName'],
          "honorificPrefix": fields['honorificPrefix'],
          "honorificSuffix": fields['honorificSuffix']
        },
        "emails": [
          {
            "value": fields['email'],
            "type": "home",
            "primary": true
          }
        ],
        "addresses": [
          {
            "streetAddress": fields['streetAddress'],
            "locality": fields['locality'],
            "region": fields['region'],
            "postalCode": fields['postalCode'],
            "type": "home",
            "primary": false
          }
        ],
        "urn:mace:oclc.org:eidm:schema:persona:wmscircpatroninfo:20180101": {
          "circulationInfo": {
            "barcode": fields['barcode'],
            "borrowerCategory": fields['borrowerCategory'],
            "homeBranch": fields['homeBranch'],
            "isVerified": fields['isVerified']
          }
        },
        "urn:mace:oclc.org:eidm:schema:persona:persona:20180305": {
          "institutionId": institution
        }
      };

      if (fields['sourceSystem'] && fields['idAtSource']) {
        let correlationInfo =
        {
          "sourceSystem": fields['sourceSystem'],
          "idAtSource": fields['idAtSource']
        };
        data["urn:mace:oclc.org:eidm:schema:persona:correlationinfo:20180101"] = {};
        data["urn:mace:oclc.org:eidm:schema:persona:correlationinfo:20180101"]["correlationInfo"] = [JSON.stringify(correlationInfo)];
      }

      if (fields['oclcExpirationDate']) {
        data['urn:mace:oclc.org:eidm:schema:persona:persona:20180305'].oclcExpirationDate = fields['oclcExpirationDate']
      }

      console.debug(data)

      if (proxy) {

        const dataArg = `'${JSON.stringify(data).replace("'", "\\'")}'`;
        const execArgs = `curl --max-time ${httpClientTimeout / 1000}${proxy ? ` --proxytunnel -x ${proxy}` : ``} -X POST --data ${dataArg} --header 'Content-Type: ${config.headers['Content-Type']}' --header 'Authorization: ${config.headers.Authorization}' ${url}`

        console.debug(execArgs)

        exec(execArgs, (error, stdout, stderr) => {
          if (error) {
            console.error('error')
            return reject(new UserError(error));
          }

          if (stdout) {
            console.log('request finished')
            console.log(stdout)
            try {
              const data = JSON.parse(stdout);
              if (+data.status >= 400) {
                return reject(new UserError(data))
              }
              return resolve(new User(data, { proxy: proxy, httpClientTimeout: httpClientTimeout }))

            } catch (error) {
              return reject(new UserError(error));
            }
          }

          console.error('stderr')
          // console.error(stderr)
          reject(stderr)
        })
      } else {
        axios.post(url, data, config)
          .then(response => {
            resolve(new User(response.data, { eTag: response.headers['etag'] }));
          })
          .catch(error => {
            reject(new UserError(error));
          });
      }
    });
  }

  static update(user, institution, accessToken) {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'User-Agent': 'node.js KAC client',
        'Content-Type': 'application/scim+json',
        'If-Match': user.getETag()
      }
    };

    let url = 'https://' + institution + serviceUrl + '/Users/' + user.getID();
    return new Promise(function (resolve, reject) {
      axios.put(url, JSON.stringify(user.doc), config)
        .then(response => {
          // parse out the User
          resolve(new User(response.data, response.headers['etag']));
        })
        .catch(error => {
          reject(new UserError(error));
        });
    });
  }

  static self(institution, accessToken) {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'User-Agent': 'node.js KAC client'
      }
    };

    let url = 'https://' + institution + serviceUrl + '/Me';
    return new Promise(function (resolve, reject) {
      axios.get(url, config)
        .then(response => {
          resolve(new User(response.data, { eTag: response.headers['etag'], proxy: this.proxy, httpClientTimeout: this.httpClientTimeout }));
        })
        .catch(error => {
          reject(new UserError(error));
        });
    });
  }

  static search(index, term, institution, accessToken) {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'User-Agent': 'node.js KAC client',
        'Content-Type': 'application/scim+json',
      }
    };
    let filter = index + ' eq "' + term + '"'
    let data = {
      "schemas": ["urn:ietf:params:scim:api:messages:2.0:SearchRequest"],
      "filter": filter
    }
    let url = 'https://' + institution + serviceUrl + '/Users/.search';
    return new Promise(function (resolve, reject) {
      axios.post(url, data, config)
        .then(response => {
          let results = [];
          response.data.Resources.forEach(function (result) {
            results.push(new User(result));
          });
          resolve(results);
        })
        .catch(error => {
          console.log(error.response.data)
          reject(new UserError(error));
        });
    });
  }
};