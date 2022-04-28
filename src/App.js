import "./App.css";
import Web3 from "web3/dist/web3.min.js";
import { useState, useEffect, useCallback } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";

function App() {
  const [web3API, setWeb3API] = useState({
    provider: null,
    web3: null,
    contract: null,
  });

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);

  const [shouldReload, reload] = useState(false);
  const reloadEffect = () => reload(!shouldReload);

  const setAccountListener = (provider) => {
    provider.on("accountChanged", (accounts) => setAccount(account[0]));
  };

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      const contract = await loadContract("Donate", provider);

      if (provider) {
        setAccountListener(provider);
        setWeb3API({
          web3: new Web3(provider),
          provider,
          contract,
        });
      } else {
        console.error("Please install Metamask");
      }
    };
    loadProvider();
  }, []);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3API.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    web3API.web3 && getAccount() && reloadEffect();
  }, [web3API.web3]);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3API;
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance), "ether");
    };
    web3API.contract && loadBalance();
  }, [web3API, shouldReload]);

  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3API;
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });
    reloadEffect();
  }, [web3API, account]);

  const Withdraw = useCallback(async () => {
    const { contract, web3 } = web3API;
    const withdrawAmount = web3.utils.toWei("0.5", "ether");
    await contract.Withdraw(withdrawAmount, {
      from: account,
    });
    reloadEffect();
  });

  return (
    <div className="faucet-wrapper">
      <div className="faucet">
        <div className="balance-view is-size-2">
          Current Balance: <strong>{balance}</strong> ETH
        </div>
        <button className="button is-primary mr-5" onClick={addFunds}>
          Donate
        </button>
        <button className="button is-danger mr-5" onClick={Withdraw}>
          Withdraw
        </button>
        <button
          className="button is-link"
          onClick={() =>
            web3API.provider.request({ method: "eth_requestAccounts" })
          }
        >
          Connect Wallets
        </button>
        <span>
          <p>
            <strong>Account Address: </strong>
            {account ? account : "Account denied"}
          </p>
        </span>
      </div>
    </div>
  );
}

export default App;
