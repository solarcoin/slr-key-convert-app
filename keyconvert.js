const ejsw = require('ethereumjs-wallet')
const bitcoinjs = require("bitcoinjs-lib")
const keccak256 = require("keccak256")
const base58 = require("bs58")
const crypto = require("crypto")
const bs58check = require("bs58check")

const decompressPubkey = (pubkey) => {
    const keypair = bitcoinjs.ECPair.fromPublicKey(Buffer.from(pubkey, 'hex'), {compressed: false})
    return keypair.publicKey.toString('hex')
}

const compressPubkey = (pubkey) => {
    const keypair = bitcoinjs.ECPair.fromPublicKey(Buffer.from(pubkey, 'hex'), {compressed: true})
    return keypair.publicKey.toString('hex')
}

const makeKeccak = (decompressedPubkey) => {
    // drop leading '04'
    return keccak256(Buffer.from(decompressedPubkey.substring(2), "hex")).toString('hex')
}

const pubkeyToEthAddress = (pubkey) => {
    const decompressedPubkey = decompressPubkey(pubkey)
    const keccak = makeKeccak(decompressedPubkey)

    // drop leading 24 bytes to get ETH address
    return keccak.substring(24)
}

// hash of *compressed* key
const pubkeyToSlrAddress = (pubkey) => {
    const keybuf = Buffer.from(pubkey, 'hex')
    const shaHash1 = crypto.createHash('sha256').update(keybuf).digest()
    const ripemd1 = crypto.createHash('ripemd160').update(shaHash1).digest()
    const xripemd1 = Buffer.concat([new Buffer([0x12]), ripemd1])
    const shaHash2 = crypto.createHash('sha256').update(xripemd1).digest()
    const shaHash3 = crypto.createHash('sha256').update(shaHash2).digest()
    const checksum = shaHash3.slice(0, 4)
    const checksumWithMd = Buffer.concat([xripemd1, checksum])
    const address = base58.encode(checksumWithMd)
    return address
}

exports.runKeyConvert = (keystring) => {

  var key = bs58check.decode(keystring)
  
  // Get a wallet instance from a private key
  const wallet = ejsw.default.fromPrivateKey(key.slice(1,33));
  
  const uncompressedPublicKey = "04" + wallet.getPublicKey().toString('hex')
  const compressedPublicKey = compressPubkey(uncompressedPublicKey)
  
  return {
    privkey: keystring,
    ethprivkey: wallet.getPrivateKey().toString('hex'),
    pubkey: compressedPublicKey,
    ethaddress: `0x${pubkeyToEthAddress(compressedPublicKey)}`,
    slraddress: pubkeyToSlrAddress(compressedPublicKey)
  }
}
