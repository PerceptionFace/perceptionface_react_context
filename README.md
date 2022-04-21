# Perception Face React Context
This is the official React Context API of Perception Face processes. With this context you will be able to connect Metamask, use our MysteryBox, and get NFT from use connected

## Dependencies
- Moralis

## How use it

Import PerceptionFace and Moralis context
```js
import { PerceptionFaceProvider } from "perceptionface_react_context";
import { MoralisProvider } from "react-moralis";
```

Use these contexts in your layout or index

```js
const Layout = ({children}) => {
    ...
        <MoralisProvider appId="[Moralis API Id]" serverUrl="[Moralis Server URL]">
            <PerceptionFaceProvider address="[Contract Address]" chain="[Chain name]">
                ....
            </PerceptionFaceProvider>
        </MoralisProvider>
    ...
};
```

Use Perception Face Hook `usePerceptionFace` in your React components to get all our functionality

```js
import { usePerceptionFace } from "perceptionface_react_context";
const ComponenteReact = () => {
    ...
        const { user, currentAccount, isAuthenticated, connect, account, disconnect, updateUser, isMisteryBoxDisabled, isMisteryBoxLoading, isNFTMinting, nftData, getRandomNFT, userNFTs } = useMysteryBox();
    ...
};
export default ComponenteReact;
```

Where the hook returns the following statuses and methods:

- user: Object with the user information from Moralis

- currentAccount: String with the current wallet address

- isAuthenticated: Boolean to know if user is authenticated with Moralis

- connect: Method to connect user metamask and authenticate with Moralis

- disconnect: Method to disconnect Moralis session

- updateUser: Method to update and sotre user info in Moralis (email, fullname, profile)

- isMisteryBoxDisabled: Boolean to know if Mystery Box is disabled

- isMysteryBoxLoading: Boolean to know if Mystery Box is loading

- isNFTMinting: Boolean to know if Mystery Box is minting a NFT

- nftData: JSON data of NFT minted

- getRandomNFT: Method to get a random NFT from Mytery Box and start Minting process

- userNFTs: Object Array with all NFT from the current user



