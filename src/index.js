import * as React from 'react';
import Moralis from 'moralis';
import { InsufficientFoundsError, MetamaskNotConnectedError, NFTAlreadyMintedError } from './utils/errors';
import { abi } from './utils/contract';
import { ethers } from 'ethers';
import axios from 'axios';
import { useMoralis } from 'react-moralis';

const defaultState = {
    user: {},
    account: null,
    currentAccount: null,
    isAuthenticating: false,
    nftPrice: 0,
    isMysteryBoxLoading: true,
    isMysteryBoxDisabled: true,
    isNFTAlreadyMinted: false,
    isNFTMinting: false,
    nftData: {},
    userNFTs: [],
    updateUser: () => {},
    connect: () => {},
    getRandomNFT: () => {},
    disconnect: () => {},
};
const PerceptionFaceContext = React.createContext(defaultState);
PerceptionFaceContext.displayName = 'PerceptionFaceContext';

const PerceptionFaceProvider = ({ children, address, chain }) => {
    const { ethereum } = typeof window !== 'undefined' ? window : {};
    const [currentAccount, setCurrentAccount] = React.useState(null);
    const [nftPrice, setNftPrice] = React.useState(null);
    const [isMysteryBoxDisabled, setMysteryBoxDisabled] = React.useState(true);
    const [isMysteryBoxLoading, setMysteryBoxLoading] = React.useState(true);
    const [isNFTMinting, setNFTMinting] = React.useState(false);
    const [nftData, setNftData] = React.useState(null);
    const [userNFTs, setUserNFTs] = React.useState([]);
    const { authenticate, isAuthenticated, isAuthenticating, user, account, logout, isInitialized } = useMoralis();

    // // Get Address from Metamask
    const getEthAccount = async () => {
        if (isAuthenticated && user) {
            setCurrentAccount(user.get('ethAddress'));
        }
    };

    // Authenticate User in Moralis
    const connect = async () => {
        if (!isAuthenticated) {
            await authenticate({ signingMessage: 'Connect to Perception Face' })
                .then((user) => {
                    setCurrentAccount(user.get('ethAddress'));
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    };

    const updateUser = async (email, fullname, profile) => {
        if (isAuthenticated && user) {
            user.setEmail(email);
            await user.set('fullname', fullname);
            await user.set('profile', profile);

            return user.save();
        }
    };

    // Log out User from Moralis
    const disconnect = async () => {
        await logout();
    };

    const getNftPrice = async () => {
        try {
            if (ethereum) {
                // Conecto al contrato
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                let contract = new ethers.Contract(address, abi, provider);
                // Obtengo el precio de tarifa
                const gweiValue = await contract.fee();
                let etherValue = ethers.utils.formatEther(gweiValue);
                const sendValue = ethers.utils.parseUnits(etherValue, 'ether');
                setNftPrice(sendValue);
            } else {
                console.log('No hay conexion a Metamask');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const initMysteryBox = async () => {
        setMysteryBoxLoading(true);
        setMysteryBoxDisabled(true);
        await Moralis.Cloud.run('AnyUnmintedNft')
            .then((response) => {
                setMysteryBoxLoading(false);
                setMysteryBoxDisabled(!response);
            })
            .catch((error) => console.log(error));
    };

    const getRandomNFT = async () => {
        if (!isAuthenticated) {
            await connect();
        }
        if (!isNFTMinting) {
            await initMysteryBox();
            setMysteryBoxDisabled(true);
            setMysteryBoxLoading(true);
            setNFTMinting(true);
            let myNFT = null;
            await Moralis.Cloud.run('GetRandomNft')
                .then((response) => (myNFT = response))
                .catch((e) => console.log(e));
            await mintNFT(myNFT);
        } else {
            console.error('NFT minting in process');
        }
    };

    const mintNFT = async (nft) => {
        try {
            if (ethereum && nftPrice) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                // Instancia el contrato
                let contract = new ethers.Contract(address, abi, signer);
                // Llama a la funcion redeem
                await contract.redeem(nft.json, nft.creator, nft.signature, nft.moralisId, { value: nftPrice });
                await getNftInfo(nft.json);
            } else {
                console.error('Metamask is not connected');
            }
        } catch (error) {
            setMysteryBoxDisabled(false);
            setMysteryBoxLoading(false);
            setNFTMinting(false);
            console.log(error);
            // Comprueba qué fue lo que causo el error
            if (!currentAccount) {
                throw new MetamaskNotConnectedError('User not connected');
            }
            // Si fue falta de fondos (code = -32000) abre el onramper
            else if (error.data.code === -32000) {
                throw new InsufficientFoundsError('Insufficient Founds');
            }
            // Si fue porque ya esta minteado (por ahora) abre un alert que avisa
            else if (error.data.code === 3) {
                throw new NFTAlreadyMintedError('NFT Already Minted');
            }
        }
    };

    const getNftInfo = async (_nftJson) => {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        let contract = new ethers.Contract(address, abi, signer);
        const myAddress = await signer.getAddress();
        let filter = contract.filters.eventMint(myAddress, null);
        // EVENTO
        contract.on(filter, async () => {
            await initMysteryBox();
            // Obtengo los datos para despues mostrar el nft
            axios
                .get(_nftJson)
                .then((response) => {
                    console.log('NFT Data', response.data);
                    setNftData(response.data);
                    setMysteryBoxDisabled(false);
                    setMysteryBoxLoading(false);
                    setNFTMinting(false);
                    initMysteryBox();
                    getUserNFTS();
                })
                .catch((error) => console.log(error));
        });
    };

    const getUserNFTS = async () => {
        if (currentAccount && isAuthenticated) {
            const nfts = await Moralis.Web3API.account.getNFTs({
                chain: chain,
                address: currentAccount,
            });
            const nftsReduced = nfts.result.reduce((filtered, nft) => {
                if (nft.metadata) {
                    filtered.push({
                        id: nft.token_id,
                        name: nft.name,
                        uri: nft.token_uri,
                        hash: nft.token_hash,
                        address: nft.token_address,
                        contract_type: nft.contract_type,
                        amount: nft.amount,
                        metadata: JSON.parse(nft.metadata),
                    });
                }

                return filtered;
            }, []);
            setUserNFTs(nftsReduced);
        }
    };

    React.useEffect(() => {
        if (isInitialized) {
            getNftPrice();
            initMysteryBox();
        }
        getEthAccount();
    }, [isAuthenticated, isInitialized]);

    React.useEffect(() => {
        if (currentAccount) {
            return getUserNFTS();
        }
    }, [currentAccount]);

    return (
        <PerceptionFaceContext.Provider
            value={{
                user,
                currentAccount,
                isAuthenticated,
                isAuthenticating,
                connect,
                account,
                disconnect,
                updateUser,
                isMysteryBoxDisabled,
                isMysteryBoxLoading,
                isNFTMinting,
                nftData,
                getRandomNFT,
                userNFTs,
            }}
        >
            {children}
        </PerceptionFaceContext.Provider>
    );
};

export default PerceptionFaceProvider;

export const usePerceptionFace = () => {
    return React.useContext(PerceptionFaceContext);
};