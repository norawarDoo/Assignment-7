// ================= Bank DApp =================
// ABI ของ Smart Contract Bank.sol
const ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "checkBlance",
    "outputs": [{ "internalType": "uint256", "name": "balance", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Withdraw",
    "type": "event"
  }
];

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
let signer = null;
let account = null;
let statusTimeout;

const $ = (id) => document.getElementById(id);

// ---------- ส่วนช่วยแสดงข้อความ ----------
function setStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message;
  status.className = isError ? "status error" : "status ok";
  clearTimeout(statusTimeout);
  if (message) {
    statusTimeout = setTimeout(() => { status.textContent = ""; }, 8000);
  }
}

function shorten(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

// ---------- เชื่อมต่อ MetaMask ----------
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    setStatus("กรุณาติดตั้ง MetaMask ก่อนใช้งาน", true);
    return;
  }
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    if (await provider.send("eth_chainId", []) !== SEPOLIA_CHAIN_HEX) {
      await provider.send("wallet_switchEthereumChain", [{ chainId: SEPOLIA_CHAIN_HEX }]);
    }
    const walletSigner = provider.getSigner();
    account = await walletSigner.getAddress();
    signer = walletSigner;
    $("accountInfo").textContent = "🔗 " + shorten(account) + " · Sepolia";
    $("connectBtn").textContent = "เชื่อมต่อแล้ว ✔";

    if ($("contractAddress").value.trim() && $("infuraApiKey").value.trim()) {
      refreshBalance();
    }
  } catch (err) {
    setStatus("เชื่อมต่อไม่สำเร็จ กรุณาเลือก Ethereum Sepolia ใน MetaMask แล้วลองอีกครั้ง", true);
  }
}

function getContractAddress() {
  const address = $("contractAddress").value.trim();
  if (!ethers.utils.isAddress(address)) {
    setStatus("กรุณากรอก Contract Address ให้ถูกต้อง", true);
    return null;
  }
  localStorage.setItem("bankContractAddress", address);
  return address;
}

// ยอดในสัญญาผูกกับ msg.sender จึงต้องส่ง address ของบัญชี MetaMask ไปใน eth_call
async function refreshBalance() {
  const address = getContractAddress();
  const apiKey = $("infuraApiKey").value.trim();
  const connectedAccount = account;
  if (!address) return;
  if (!connectedAccount || !apiKey) {
    setStatus("กรุณาเชื่อมต่อ MetaMask และกรอก Infura API Key ก่อนเช็กยอดเงิน", true);
    return;
  }

  const requestIsCurrent = () =>
    account === connectedAccount &&
    $("contractAddress").value.trim() === address &&
    $("infuraApiKey").value.trim() === apiKey;

  try {
    const rpcUrl = "https://sepolia.infura.io/v3/" + encodeURIComponent(apiKey);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, SEPOLIA_CHAIN_ID);
    const contract = new ethers.Contract(address, ABI, provider);
    const balance = await contract.checkBlance({ from: connectedAccount });
    if (requestIsCurrent()) {
      $("balance").textContent = ethers.utils.formatEther(balance) + " ETH";
    }
  } catch {
    if (requestIsCurrent()) {
      $("balance").textContent = "— ETH";
      setStatus("อ่านยอดผ่าน Infura ไม่สำเร็จ กรุณาตรวจสอบ API Key และ Contract Address บน Sepolia", true);
    }
  }
}

async function getTransactionContract() {
  if (!signer || await signer.provider.send("eth_chainId", []) !== SEPOLIA_CHAIN_HEX) {
    setStatus("กรุณาเชื่อมต่อ MetaMask บน Ethereum Sepolia ก่อนทำรายการ", true);
    return null;
  }
  const address = getContractAddress();
  if (!address) return null;
  if (await signer.provider.getCode(address) === "0x") {
    setStatus("ไม่พบสัญญาที่ Contract Address นี้บน Sepolia", true);
    return null;
  }
  return new ethers.Contract(address, ABI, signer);
}

// ---------- Deposit ----------
async function deposit() {
  const amount = $("depositAmount").value;
  if (!amount || Number(amount) <= 0) {
    setStatus("กรุณาระบุจำนวนเงินที่ต้องการฝาก", true);
    return;
  }
  try {
    const contract = await getTransactionContract();
    if (!contract) return;
    setStatus("กำลังฝากเงิน... กรุณารอสักครู่");
    const tx = await contract.deposit({
      value: ethers.utils.parseEther(amount)
    });
    setStatus("ส่งธุรกรรมแล้ว กำลังรอยืนยัน... tx: " + tx.hash);
    await tx.wait();
    setStatus("ฝากเงินสำเร็จ ✅ (" + amount + " ETH)");
    $("depositAmount").value = "";
    if ($("infuraApiKey").value.trim()) refreshBalance();
  } catch (err) {
    setStatus("ฝากเงินไม่สำเร็จ: " + (err.data?.message || err.message), true);
  }
}

// ---------- Withdraw ----------
async function withdraw() {
  const amount = $("withdrawAmount").value;
  if (!amount || Number(amount) <= 0) {
    setStatus("กรุณาระบุจำนวนเงินที่ต้องการถอน", true);
    return;
  }
  try {
    const contract = await getTransactionContract();
    if (!contract) return;
    setStatus("กำลังถอนเงิน... กรุณารอสักครู่");
    const tx = await contract.withdraw(ethers.utils.parseEther(amount));
    setStatus("ส่งธุรกรรมแล้ว กำลังรอยืนยัน... tx: " + tx.hash);
    await tx.wait();
    setStatus("ถอนเงินสำเร็จ ✅ (" + amount + " ETH)");
    $("withdrawAmount").value = "";
    if ($("infuraApiKey").value.trim()) refreshBalance();
  } catch (err) {
    setStatus("ถอนเงินไม่สำเร็จ: " + (err.data?.message || err.message), true);
  }
}

// ---------- ผูกเหตุการณ์กับปุ่ม ----------
$("connectBtn").addEventListener("click", connectWallet);
$("refreshBtn").addEventListener("click", refreshBalance);
$("depositBtn").addEventListener("click", deposit);
$("withdrawBtn").addEventListener("click", withdraw);
$("contractAddress").addEventListener("change", () => {
  $("balance").textContent = "— ETH";
  if (getContractAddress() && account && $("infuraApiKey").value.trim()) {
    refreshBalance();
  }
});
$("infuraApiKey").addEventListener("change", () => {
  if (account && $("contractAddress").value.trim()) refreshBalance();
});

window.ethereum?.on("accountsChanged", () => {
  signer = null;
  account = null;
  $("accountInfo").textContent = "ยังไม่ได้เชื่อมต่อ";
  $("connectBtn").textContent = "เชื่อมต่อ MetaMask";
  $("balance").textContent = "— ETH";
});
window.ethereum?.on("chainChanged", () => {
  $("accountInfo").textContent = account ? "🔗 " + shorten(account) : "ยังไม่ได้เชื่อมต่อ";
});

// ---------- โหลดครั้งแรก: ดึง address ที่เคยบันทึกไว้ ----------
const savedAddress = localStorage.getItem("bankContractAddress");
if (savedAddress) {
  $("contractAddress").value = savedAddress;
}
