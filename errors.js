export class InsufficientFoundsError extends Error {
    constructor(message) {
        super(message)
        this.name = 'Insufficient_Founds'
        this.message = message
    }
}

export class NFTAlreadyMintedError extends Error {
    constructor(message) {
        super(message)
        this.name = 'NFT_Already_Minted'
        this.message = message
    }
}

export class MetamaskNotConnectedError extends Error {
    constructor(message) {
        super(message)
        this.name = 'Metamask_Not_Connected'
        this.message = message
    }
}