/**
 * @flow
 * @relayHash 41d1470e63eee0a9c288e7136dc50686
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type Launcher_identities$ref = any;
export type LauncherQueryVariables = {||};
export type LauncherQueryResponse = {|
  +viewer: {|
    +identities: {|
      +$fragmentRefs: Launcher_identities$ref
    |}
  |}
|};
export type LauncherQuery = {|
  variables: LauncherQueryVariables,
  response: LauncherQueryResponse,
|};
*/


/*
query LauncherQuery {
  viewer {
    identities {
      ...Launcher_identities
    }
    id
  }
}

fragment Launcher_identities on Identities {
  ownUsers {
    defaultEthAddress
    localID
    feedHash
    profile {
      name
      ethAddress
    }
    wallets {
      hd {
        localID
        id
      }
      ledger {
        localID
        id
      }
    }
    id
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "localID",
  "args": null,
  "storageKey": null
},
v1 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "id",
  "args": null,
  "storageKey": null
},
v2 = [
  v0,
  v1
];
return {
  "kind": "Request",
  "operationKind": "query",
  "name": "LauncherQuery",
  "id": null,
  "text": "query LauncherQuery {\n  viewer {\n    identities {\n      ...Launcher_identities\n    }\n    id\n  }\n}\n\nfragment Launcher_identities on Identities {\n  ownUsers {\n    defaultEthAddress\n    localID\n    feedHash\n    profile {\n      name\n      ethAddress\n    }\n    wallets {\n      hd {\n        localID\n        id\n      }\n      ledger {\n        localID\n        id\n      }\n    }\n    id\n  }\n}\n",
  "metadata": {},
  "fragment": {
    "kind": "Fragment",
    "name": "LauncherQuery",
    "type": "Query",
    "metadata": null,
    "argumentDefinitions": [],
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "viewer",
        "storageKey": null,
        "args": null,
        "concreteType": "Viewer",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "name": "identities",
            "storageKey": null,
            "args": null,
            "concreteType": "Identities",
            "plural": false,
            "selections": [
              {
                "kind": "FragmentSpread",
                "name": "Launcher_identities",
                "args": null
              }
            ]
          }
        ]
      }
    ]
  },
  "operation": {
    "kind": "Operation",
    "name": "LauncherQuery",
    "argumentDefinitions": [],
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "viewer",
        "storageKey": null,
        "args": null,
        "concreteType": "Viewer",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "name": "identities",
            "storageKey": null,
            "args": null,
            "concreteType": "Identities",
            "plural": false,
            "selections": [
              {
                "kind": "LinkedField",
                "alias": null,
                "name": "ownUsers",
                "storageKey": null,
                "args": null,
                "concreteType": "OwnUserIdentity",
                "plural": true,
                "selections": [
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "name": "defaultEthAddress",
                    "args": null,
                    "storageKey": null
                  },
                  v0,
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "name": "feedHash",
                    "args": null,
                    "storageKey": null
                  },
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "name": "profile",
                    "storageKey": null,
                    "args": null,
                    "concreteType": "NamedProfile",
                    "plural": false,
                    "selections": [
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "name": "name",
                        "args": null,
                        "storageKey": null
                      },
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "name": "ethAddress",
                        "args": null,
                        "storageKey": null
                      }
                    ]
                  },
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "name": "wallets",
                    "storageKey": null,
                    "args": null,
                    "concreteType": "EthWallets",
                    "plural": false,
                    "selections": [
                      {
                        "kind": "LinkedField",
                        "alias": null,
                        "name": "hd",
                        "storageKey": null,
                        "args": null,
                        "concreteType": "EthHDWallet",
                        "plural": true,
                        "selections": v2
                      },
                      {
                        "kind": "LinkedField",
                        "alias": null,
                        "name": "ledger",
                        "storageKey": null,
                        "args": null,
                        "concreteType": "EthLedgerWallet",
                        "plural": true,
                        "selections": v2
                      }
                    ]
                  },
                  v1
                ]
              }
            ]
          },
          v1
        ]
      }
    ]
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '7b17d4721b814a9fdf9e02d9022a155d';
module.exports = node;
