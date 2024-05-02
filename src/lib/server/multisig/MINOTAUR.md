Bob commitment:

{"MSR":"{\"tx\":\"oAIBiZUfq4tjvcSR2bEYSz67jvnOOBhM2lfDvTdNFkufcmkAAAAAA8CWsQIACM0CGQPRtJuMFjUCWEWFtwz9ZFjrvqZ/0JiXR3KKiCVfKZHYpUwAAIDqMBADBAQIzQIz6amTXIu7iuCbLJRMHQYEkqiDIlJmXgQ7BzK99ZO/LAjNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHmHMAgwIIcwFzAtilTAAA4JFDEAUEAAQADjYQAgSgCwjNAnm+Zn753LusVaBilc6HCwcCm/zbLc4o2VnygVsW+BeY6gLRkqOajMenAXMAcwEQAQIEAtGWgwMBk6OMx7KlcwAAAZPCsqVzAQB0cwJzA4MBCM3urJOxpXME2KVMAACWAs0CM+mpk1yLu4rgmyyUTB0GBJKogyJSZl4EOwcyvfWTvyzNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHAAA=\",\"boxes\":[\"oJKlAxADBAQIzQIz6amTXIu7iuCbLJRMHQYEkqiDIlJmXgQ7BzK99ZO/LAjNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHmHMAgwIIcwFzArWKTAAAVROqie16lDbZMRDntctVQ99GcsmSujk9v4FlrrRyymcB\"],\"commitments\":[[\"A74REs/r8FdFz7jOFMo3HWAei4QNneIV9UG54gHGsXIT\",\"\"]],\"simulated\":[],\"signed\":[],\"partial\":\"\"}"}

Bob Copy, Alice pasta, Alice commitment, Alice sign:

{"MSR":"{\"tx\":\"oAIBiZUfq4tjvcSR2bEYSz67jvnOOBhM2lfDvTdNFkufcmkAAAAAA8CWsQIACM0CGQPRtJuMFjUCWEWFtwz9ZFjrvqZ/0JiXR3KKiCVfKZHYpUwAAIDqMBADBAQIzQIz6amTXIu7iuCbLJRMHQYEkqiDIlJmXgQ7BzK99ZO/LAjNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHmHMAgwIIcwFzAtilTAAA4JFDEAUEAAQADjYQAgSgCwjNAnm+Zn753LusVaBilc6HCwcCm/zbLc4o2VnygVsW+BeY6gLRkqOajMenAXMAcwEQAQIEAtGWgwMBk6OMx7KlcwAAAZPCsqVzAQB0cwJzA4MBCM3urJOxpXME2KVMAACWAs0CM+mpk1yLu4rgmyyUTB0GBJKogyJSZl4EOwcyvfWTvyzNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHAAA=\",\"boxes\":[\"oJKlAxADBAQIzQIz6amTXIu7iuCbLJRMHQYEkqiDIlJmXgQ7BzK99ZO/LAjNAusINCMEEAN0DJ55Gy/qXs9uJzZpYwolt+yr+RRTleRHmHMAgwIIcwFzArWKTAAAVROqie16lDbZMRDntctVQ99GcsmSujk9v4FlrrRyymcB\"],\"commitments\":[[\"A74REs/r8FdFz7jOFMo3HWAei4QNneIV9UG54gHGsXIT\",\"AkS6lyfiNeICNqlONdD9q9eD/IOBgCK9OiXeqWmxpNEJ\"]],\"simulated\":[],\"signed\":[\"9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8\"],\"partial\":\"AYmVH6uLY73EkdmxGEs+u475zjgYTNpXw703TRZLn3JpWIeAOJOzhgESzIhfS8cwUmjo9hV0tKLK1m2O6mm9Pveea3OIzZt92M6QHbUZi5D6tckEBf5SEqbdafSSHZQtTpbAiysQD1UbFFzsx3vQXonBP/PZiH3+/HcAAAADwJaxAgAIzQIZA9G0m4wWNQJYRYW3DP1kWOu+pn/QmJdHcoqIJV8pkdilTAAAgOowEAMEBAjNAjPpqZNci7uK4JsslEwdBgSSqIMiUmZeBDsHMr31k78sCM0C6wg0IwQQA3QMnnkbL+pez24nNmljCiW37Kv5FFOV5EeYcwCDAghzAXMC2KVMAADgkUMQBQQABAAONhACBKALCM0Ceb5mfvncu6xVoGKVzocLBwKb/NstzijZWfKBWxb4F5jqAtGSo5qMx6cBcwBzARABAgQC0ZaDAwGTo4zHsqVzAAABk8KypXMBAHRzAnMDgwEIze6sk7GlcwTYpUwAAA==\"}"}

tests:
{
  alice: {
    secretHints: { '0': [] },
    publicHints: {
      '0': [
        {
          hint: 'cmtReal',
          pubkey: {
            op: '205',
            h: '0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c'
          },
          type: 'dlog',
          a: '03603f9b4e3054cc6bc45fb171633ac6d46f181f0d5e0b69682d8d3cdc681a007f',
          position: '0-0'
        },
        {
          hint: 'cmtWithSecret',
          pubkey: {
            op: '205',
            h: '0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c'
          },
          secret: '7a135592a974546b5c6bb5e783987417778283aa36d7dc81d011913c7020bb6d',
          type: 'dlog',
          a: '03603f9b4e3054cc6bc45fb171633ac6d46f181f0d5e0b69682d8d3cdc681a007f',
          position: '0-0'
        },
        {
          hint: 'cmtReal',
          pubkey: {
            op: '205',
            h: '02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447'
          },
          type: 'dlog',
          a: '0370f30dab343b2ec00d709bcc359dcd0eef8d00eefc155a6fe2735ab348959b85',
          position: '0-1'
        },
        {
          hint: 'cmtWithSecret',
          pubkey: {
            op: '205',
            h: '02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447'
          },
          secret: 'dc94bc5a57413f6405c4c129771c97e87b6f35d499d7935fdb750902942d813d',
          type: 'dlog',
          a: '0370f30dab343b2ec00d709bcc359dcd0eef8d00eefc155a6fe2735ab348959b85',
          position: '0-1'
        }
      ]
    }
  },
  bob: {
    secretHints: { '0': [] },
    publicHints: {
      '0': [
        {
          hint: 'cmtReal',
          pubkey: {
            op: '205',
            h: '0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c'
          },
          type: 'dlog',
          a: '03603f9b4e3054cc6bc45fb171633ac6d46f181f0d5e0b69682d8d3cdc681a007f',
          position: '0-0'
        },
        {
          hint: 'cmtWithSecret',
          pubkey: {
            op: '205',
            h: '0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c'
          },
          secret: '7a135592a974546b5c6bb5e783987417778283aa36d7dc81d011913c7020bb6d',
          type: 'dlog',
          a: '03603f9b4e3054cc6bc45fb171633ac6d46f181f0d5e0b69682d8d3cdc681a007f',
          position: '0-0'
        }
      ]
    }
  }
}

minotaur:
{
    "secretHints": {
        "0": [
            {
                "hint": "proofReal",
                "pubkey": {
                    "op": "205",
                    "h": "02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447"
                },
                "challenge": "87803893b3860112cc885f4bc7305268e8f61574b4a2cad6",
                "proof": "87803893b3860112cc885f4bc7305268e8f61574b4a2cad669f4921d942d4e96c08b2b100f551b145cecc77bd05e89c13ff3d9887dfefc77",
                "position": "0-1"
            }
        ]
    },
    "publicHints": {
        "0": [
            {
                "hint": "cmtReal",
                "pubkey": {
                    "op": "205",
                    "h": "02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447"
                },
                "type": "dlog",
                "a": "0244ba9727e235e20236a94e35d0fdabd783fc83818022bd3a25dea969b1a4d109",
                "position": "0-1"
            }
        ]
    }
}

"87803893b3860112cc885f4bc7305268e8f61574b4a2cad 669f4921d942d4e96c08b2b100f551b145cecc77bd05e89c13ff3d9887dfefc77"
"87803893b3860112cc885f4bc7305268e8f61574b4a2cad 62ede05f4da3d1fb0b6d20d5cfab47031bcf51142d2f1c8f006b616594adf150 669f4921d942d4e96c08b2b100f551b145cecc77bd05e89c13ff3d9887dfefc77"


"[GraphQL] Malformed transaction: Creation height of any output should be not less than   1240713 is less than max creation height in inputs(1250006), output id: 4d4baca1890093649035197f5c6b9e28e1687a52a77a2d71e2e15050516b2481: output ErgoBox(0f5be66888f154d9c804ce95336e6a355dd771a4aff5bab07d0174e1a1e79e62,98900000,ErgoTree(0,WrappedArray(),Right(ConstantNode(SigmaProp(ProveDlog(ECPoint(33e9a9,377709,...))),SSigmaProp)),80,[B@37aecbb4,Some(false)),tokens: (Coll()), 4d4baca1890093649035197f5c6b9e28e1687a52a77a2d71e2e15050516b2481, 0, Map(), 1240713)"

"[GraphQL] Malformed transaction: Transaction outputs should have creationHeight not exceeding block height.  1250175 <= 1250174 is not true, output id: 2e3d4fe40fad05499060e6d56cc0a5e77a5c1d02509d5d860f15e13b0d634757: output ErgoBox(b2b8202887c5397d23aa4fe816f5948609534c6b2d1d234a5e7dcef60eeefa2f,98900000,ErgoTree(0,WrappedArray(),Right(ConstantNode(SigmaProp(ProveDlog(ECPoint(33e9a9,377709,...))),SSigmaProp)),80,[B@38599f3b,Some(false)),tokens: (Coll()), 2e3d4fe40fad05499060e6d56cc0a5e77a5c1d02509d5d860f15e13b0d634757, 0, Map(), 1250175)"

{
    "code": -2,
    "info": "[GraphQL] Malformed transaction: Scripts of all transaction inputs should pass verification. 984d0fe6a3758fdf385463c95baf29784874d4fc5f3f49c4e822dfae0366528b: #0 => Success((false,801))"
}