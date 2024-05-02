export async function headers() {
    return fetch('https://gql.ergoplatform.com/', {
        method: 'POST',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Origin': 'https://gql.ergoplatform.com'
        },
        body: JSON.stringify({
            query: `
                query Headers($take: Int) {
                    blockHeaders(take: $take) {
                        headerId
                        parentId
                        version
                        height
                        difficulty
                        adProofsRoot
                        stateRoot
                        transactionsRoot
                        timestamp
                        nBits
                        extensionHash
                        powSolutions
                        votes
                    }
                }
            `,
            variables: {
                take: 10
            }
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => data.data.blockHeaders); // Extracting the 'blockHeaders' array from the response data
}
