// 用 EAZO_PRIVATE_KEY 对应的公钥，按 SDK 的 ECIES 算法加密一个测试 userInfo，产出合法 x-eazo-session
const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
require("dotenv").config?.();
let PK = process.env.EAZO_PRIVATE_KEY;
if(!PK){ const fs=require("fs"); const m=fs.readFileSync(".env","utf8").match(/EAZO_PRIVATE_KEY=(\S+)/); PK=m&&m[1]; }
if(!/^[0-9a-f]{64}$/i.test(PK)){ console.error("no valid private key"); process.exit(1); }
const recipient = ec.keyFromPrivate(PK,"hex");
const recipientPub = recipient.getPublic();

const userInfo = { data: { id:"test-user-mcp", email:"mcp@test.local", name:"MCP Tester" } };
const raw = JSON.stringify(userInfo);

// 1) 随机 AES-256-GCM 加密 payload
const aesKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const c2 = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
let encData = c2.update(raw,"utf8"); encData = Buffer.concat([encData, c2.final()]);
const authTag = c2.getAuthTag();

// 2) ECIES 包 aesKey: 临时密钥 ECDH -> sha256 -> aes-256-cbc
const eph = ec.genKeyPair();
const ephPubCompressed = Buffer.from(eph.getPublic(true,"hex"),"hex"); // 33B
const shared = eph.derive(recipientPub);
const sharedBuf = Buffer.from(shared.toString(16).padStart(64,"0"),"hex");
const decKey = crypto.createHash("sha256").update(sharedBuf).digest();
const cipherIv = crypto.randomBytes(16);
const c1 = crypto.createCipheriv("aes-256-cbc", decKey, cipherIv);
let ct = c1.update(aesKey); ct = Buffer.concat([ct, c1.final()]);
const encryptedKey = Buffer.concat([ephPubCompressed, cipherIv, ct]).toString("base64");

const session = { encryptedData: encData.toString("base64"), encryptedKey, iv: iv.toString("base64"), authTag: authTag.toString("base64") };
process.stdout.write(JSON.stringify(session));
