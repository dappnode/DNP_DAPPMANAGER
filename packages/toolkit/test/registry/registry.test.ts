import { ethers } from "ethers";
import { expect } from "chai";
import {
  DNPRegistryEntry,
  PublicRegistryEntry,
  DappNodeRegistry,
} from "../../src/registry/index.js";

// TODO: graphs must be published in the graph, preferably arbitrum network
// also the logic in the registry would have to be updated to take into account the Arbitrum network

describe.skip("Dappnode Registry", function () {
  this.timeout(100000);

  it.skip(`should get dnp newRepos`, async () => {
    const expectedResult: DNPRegistryEntry[] = [
      {
        id: "0x014a26511e1a8896e6b60002f82de526ee2e3452e5a170b74bc97c01fc4864f9f8000000",
        Registry_id:
          "0x9065e899278bfe16c390b5d81d9ebc4fbde55d165d9540514a84a90a43eac925",
        name: "obol-distributed-validator-goerli",
        repo: "0xf5cafb2faeb8f368ea32c5f0320f85f2256c842f",
      },
      {
        id: "0x021697cf9d3ab0fcb7367bfd985a6155bc9031a1a9969e9f838bf4763e617b5847010000",
        Registry_id:
          "0x17fca662c707becee1a5697924b2629d82640a9f10073909d3dac84f07d326c4",
        name: "nimbus",
        repo: "0xba70010765448a897bd7341f7281047c88afc017",
      },
      {
        id: "0x0257b5da5715e198ceeeaee68fed9dbd46406b7bfbe80578f17f38bf5c2da41021000000",
        Registry_id:
          "0x0ef23df5b5de2e971b29989e95a9e592becfec94b4f31292e1b65710e2e4ba7a",
        name: "ethereum-classic",
        repo: "0xe73a101064c7fe367798e1cb48ce3fd19b54bf8b",
      },
      {
        id: "0x026eacc888db66977846c7d2ee7f5394803459f9cf14a634c95065092578630617000000",
        Registry_id:
          "0x7081a5275683a2b2e506052abfdc9c7aab2141fda95a3a83dfb793f0f0e1c110",
        name: "telegram-mtpproto",
        repo: "0xdf6da6515943bc5cab1c49380b816712ae0501f0",
      },
      {
        id: "0x074d45071f362f98c575bf48f63a7b026a45ec791ea5c7ef203dee9581c76a2cbf000000",
        Registry_id:
          "0xd9ea6cf5c20cbc09d529ae706f302f4ab650f538d7ebb1acfd5692800a9662b2",
        name: "nimbus-prater",
        repo: "0xee9ab633d545ef3c53943e9ff6dfefa3ccfd1ed0",
      },
      {
        id: "0x08b592c227a0e92a2e42499f282b6f0099349e328c8f22d836f3bb674b4c795e47000000",
        Registry_id:
          "0x779809cb8a44dac10ed6de506b7e81a119e59bb7779835dc8ecf98d3e9daf368",
        name: "vipnode",
        repo: "0xb185207e58bdf71b6aaf9a4c3c47ddbadf614837",
      },
      {
        id: "0x09331656eb6f569fac942d8ba5a7d820a617eebb25958187db7bb5f5990bb21618000000",
        Registry_id:
          "0xdcf984031c630ae519135e5983a63582a71f213203961d39a0357409c2c3d377",
        name: "rinkeby",
        repo: "0x2dbc4622fde0dc5d1d1c6fc908678cddba81c189",
      },
      {
        id: "0x09dc874847d34a80852945a374f698a8944a1c23bbf56038b9d04e2371ec0e76a3000000",
        Registry_id:
          "0xd590af62cfe91593fdc5d0041198b18f9889ee113f58ff391e6b3b4df5a060c4",
        name: "prysm-altona-beacon-chain",
        repo: "0x03de00ee0c8df6f5a2102f4f7f12e217f408e901",
      },
      {
        id: "0x0a821ac355ebd2d8001a0510866d8bd1e5b8c13762c6a1ef6a196ec20321e743b7010000",
        Registry_id:
          "0xe011f7dc9b528fa6a2286c4b48c0100d0d918f3fdfcf793267ec14668ffae910",
        name: "openethereum-gnosis-chain",
        repo: "0xd4cd85bdb2b7fa5c5a1651333646b6e9abb48d4d",
      },
      {
        id: "0x0dd67595f4f9844010a50343c80a52ba1b49e11ce5a151795ff84b9e868a4adde3000000",
        Registry_id:
          "0x9fb37182ce192d1e4124a3278f9d3839295df1a8193f2dc95d4473366b733787",
        name: "near",
        repo: "0x21946e94968c100f361ee5a9a1df82cbe6803324",
      },
      {
        id: "0x0e08b6ed1d5e3ed6fef904e063d295401e4168fac757058b070a34b3d52469d318010000",
        Registry_id:
          "0x9090c535741297574813af66add9878a5320269cfb9be133bd0adc2f57d35e1e",
        name: "prysm-prater",
        repo: "0x448bfb454718f20941fe8a1bfa63a0024f21ba50",
      },
      {
        id: "0x10a76e0604bb5a6047bc8c1b60ec2723e79adcab456cda97b6cfebeaeaf7d54638000000",
        Registry_id:
          "0xd88b3d6ce3b30af8a8a6ee417f1618117bd2ff9dad4788f51d6d76b1f12726d1",
        name: "trustlines",
        repo: "0x38bcfc1a7b62cae7970e04b08ed2b8d8b929bbb0",
      },
      {
        id: "0x1bdae8fe839f9aacb8d36c32688c0c102cfe25637513d03a2319e5a633e3967351000000",
        Registry_id:
          "0xc9f0ebf2b13c6c275b627e5b277b1a8500915f0eb44041b7b37c4eba54dd9e15",
        name: "swarm",
        repo: "0xc95874dc912473dcd83a629df70697584d0fd5a6",
      },
      {
        id: "0x1e50879e31384cc983bdd0384334c7c32ebc88de30c16d5f0f9237acfe4cbe658a000000",
        Registry_id:
          "0x8f8eb5744c9c9f62af04b6b00ef91c8270b8ec5c80c78c639149786d6482f636",
        name: "trustlines-monitor",
        repo: "0x7e538ebb507d56de0fb6c573d9be0f9cdec5c528",
      },
      {
        id: "0x25501cd00571cd77ea46ad293bac791179a205fa83fd2bf67eafa5ae0b062a66ba000000",
        Registry_id:
          "0x318c5d4049ae9a3ce0d57faa89809c467dbed9c37c2f3e0530d43f83ff499fae",
        name: "owncloud",
        repo: "0x5b4dbd3dcd44c61ef335d636abb63d930f867dcc",
      },
      {
        id: "0x26155590c88cf19f2e9423f7a38b8aef04f2bf31c3cd6af97d23cf323d206675e9000000",
        Registry_id:
          "0x43ea2649216c683b199304c4e726a644b31a051e6204d9fcce11412b21510947",
        name: "lighthouse",
        repo: "0xd462b403b48fa4423574751b9150bbe512a38d3d",
      },
      {
        id: "0x27829d524b413b749fe9040a657a8ecebaedd6e9952c96a93259287f7e706ae339010000",
        Registry_id:
          "0x80f8f77268c3abf7ec28c8f38b7a2ed2997a9a0cd635ba6ac74fc58b2a38aca1",
        name: "rotki",
        repo: "0x8730413f2d7af5a0cf63a988a0f6417fec05f328",
      },
      {
        id: "0x28089c3b742262b67ca154405b9e592c8bb3e327472c9a4040cbcfb3c658801d3a010000",
        Registry_id:
          "0x0820cca33f5f5d2358421fcdce11fce18e5b76b6d57d789f65f4276c7d24c072",
        name: "goerli-besu",
        repo: "0xf508c8fc3f121b18794489659a5e2ccc255e9ca2",
      },
      {
        id: "0x308d355d42c09128ccc026179e8667e0088be4595caf0f75d9c8c5b860c2bd1d41000000",
        Registry_id:
          "0x01b79344baaf507ef39b34456d1a5af54c18e28f7cc93b0e5a257968225c8b83",
        name: "dappmanager",
        repo: "0x0c564ca7b948008fb324268d8baedaeb1bd47bce",
      },
      {
        id: "0x3372478f895618fa4244b4705b3796c661a20cd86df2be8ae5dc89f5c0cb6d9f06010000",
        Registry_id:
          "0x7de8807f96670eb3eb2d9f55ea5ddd8d5698116eefc598e2d4ddfc08a165f8b9",
        name: "mysterium",
        repo: "0xec5cac88a52ae5d476659eca7678e13b5880b124",
      },
      {
        id: "0x34065ec191750a2d6a3fa92f348cd74edecd137201a90dc10b86fde357205cf297020000",
        Registry_id:
          "0xfded6fee3a8170dbf5c38f6a2f3eb2568806e9bc9a72266fa1a19a67e6e4c77c",
        name: "kzg-ceremony",
        repo: "0x76d8c8a0bab926735bf4d623064c84751936d368",
      },
      {
        id: "0x3994e04e5726ab19b3f0c2ddb56288158260439974130b25d9bfdfdfad7b69da5c000000",
        Registry_id:
          "0x94aa44e77be7b08d8cc21ab894bc7619bc042b6cdcb2a9432bb59c3e93b1d723",
        name: "bind",
        repo: "0xb7e15019b306b9d76068742330e10cdc61bf5006",
      },
      {
        id: "0x3ad936480cc2f91e71b0547b0d7a9a62766eba8f601619b61d4d9a9a66aec5102a000000",
        Registry_id:
          "0xbd2ac1fd73dc14df967463421b3aa6fcbade0c12dde17434d5813a2deb168d21",
        name: "wamp",
        repo: "0x5dc20eafe63f8afaedf75978e9362de30458678f",
      },
      {
        id: "0x3bdc1bcf5efb62d589828a0a25f76097a0bcf1dba9cf9e5535cbf90cb62a7b92d3010000",
        Registry_id:
          "0x6e70b63023be6082de91c2cce2bbc1443015f3c422916c3534e1c661b18229ed",
        name: "alephium",
        repo: "0x755ba9fc74f86064c079e88e1f3c4bc42f384782",
      },
      {
        id: "0x3c780dda79da73ca3b81606790754d659b54086142c90343ad3154c17fe2a0949d000000",
        Registry_id:
          "0x1a366800b0339484e5ba5f30ed35795e088ebd35136141aa7cf13868dc8df626",
        name: "prysm-onyx-validator",
        repo: "0x925844a2170197bec05e3b7fb93f594f47d9d95a",
      },
      {
        id: "0x3d1dc357c1f484c5e884f5bc21db44ba1cc471569fd53abd90a969686841a00839000000",
        Registry_id:
          "0xbb83503785465fb3cb81650c9b04797d8f199f4f2e8bb51fbd5790852e2be257",
        name: "ln",
        repo: "0x7cb0fe4f4081cc9e5579bac9957efefd9e945ffa",
      },
      {
        id: "0x4087d76b686748d2ae6626a032614ce2a402a207fbbf099451d17f6b2cade4e862000000",
        Registry_id:
          "0x4feb3c0b0b2dc37cf7a616dd81954cbd29c175aa073bdba8ef2b55ef0b13419d",
        name: "ipfs-cluster",
        repo: "0x39ef4e2d2d62134b1b71103fa7a895fda023fe4d",
      },
      {
        id: "0x41a71ddc3e5c74b7ada5a474e25106d6cecc4a94d90c8894ab95b3c236d4e55a9b000000",
        Registry_id:
          "0x39f63913f7af0a429363db00991d99a172686f1293583b47e835bc9bb1a48bea",
        name: "prysm-witti-beacon-chain",
        repo: "0xd5a903a8a937e0dc5454d81d92935ee128bec619",
      },
      {
        id: "0x437d6ad76f4c5018934bfbe175167a98f125af5254be22542713a930e7f5a5544a000000",
        Registry_id:
          "0x1c9ed137a1a36b767cdddc02cbf740e11555661cf2e57b73406463190a28926e",
        name: "goerli-geth",
        repo: "0x95cbf3e9465d364fdb05e7aa8cdd7a2dcfc46f93",
      },
      {
        id: "0x43b5a650e015e9db4d1b17885bcdfa70c40773198465403d3232740c168b66b53c000000",
        Registry_id:
          "0x9b7eaca50c703d6e239e0f32a403c19ea7ff82eee8cd2d84ce2a5b42ec12cd1f",
        name: "goerli-parity",
        repo: "0x05d7549a6ec4e51cd4e01cf5af9d68178529bf70",
      },
      {
        id: "0x47aca895c82d17367dafb4d1d021f00bfb031e67a5143f60555089990bbc1a3f7f010000",
        Registry_id:
          "0xb82151dc9b82ca9929d25b5dd70eb60cf40a5e660d1053a43800ed4c1f87b2e3",
        name: "lighthouse-gnosis",
        repo: "0xe7098fdb1092aada6795c20f88db067422b9d684",
      },
      {
        id: "0x48ca92e86b4dbe56b9205d07bd7e63bad9a71fedc1c3a9024e6dec2be814ae98a0000000",
        Registry_id:
          "0xc920c264771840651697551d5a4239e21f68cf41e209eb3b0f3f3597a7c114f7",
        name: "prysm-pyrmont",
        repo: "0x9a8a338023112ebf7c1cccd9ca76e93e3465a5b2",
      },
      {
        id: "0x497957f158f8f8968896e6c3b8ff94da8f29270f3ae5f64423c603dc2eaf556b52000000",
        Registry_id:
          "0x9ff21bae01f1b5af11add7ae425a1b0d18b73e4b556207650a1bde1c2d066dac",
        name: "ropsten",
        repo: "0x031340b7aa2c5c28719894f3bacddead5e7f2987",
      },
      {
        id: "0x4ad6e0514549e09bac67ca38f575a73a828a6a16ce2827087be5330e28656c4c1d010000",
        Registry_id:
          "0x5dc2e01a6670e07cb880e2fad00c51ed14691a37cfdf96d4c71d67694fe344e4",
        name: "lodestar-gnosis",
        repo: "0x415b7954702c1319b7d3a14a8808347a5f72347d",
      },
      {
        id: "0x4ffdb3dcdf54d9cf858bce70150696bb3d457b83b4d1f6dd7d7b00ea1c4336684b000000",
        Registry_id:
          "0x46b23626afddd05c28aba3258b6c87ddd205464f5915ffc9fe1f97370ee27a96",
        name: "letsencrypt-nginx",
        repo: "0xbbe87320cbf596c7d906dfb126a22292872b474b",
      },
      {
        id: "0x50eb618f9b9cc2c59217d5ab62f98bedfa427e4180546bf694360b9fea3f493f7e000000",
        Registry_id:
          "0xc7aa5321b078c5ec3858d36571fe06ea490c707b761f8c515da68e115bfbb848",
        name: "teku-gnosis",
        repo: "0xa2333f5c0e13c71965e43235b70ebd2ab4adc539",
      },
      {
        id: "0x53ec495fd64deca1e36fb480e7e2998da71092dc9377cc0f1bb7bac8ea066ce7cb000000",
        Registry_id:
          "0x7a5b1e2985a74d1f338c801fddcbf02ac3293f0bf580057247072550ecebf898",
        name: "https",
        repo: "0x24c0da30d03104db15d8ae6c9357edfcbc09273f",
      },
      {
        id: "0x53f52fe40ae45fc094e4019ef1e115141ca919c133d70574089cf26538994da38b000000",
        Registry_id:
          "0xe4c620a854090d5af359820aa6fd22b5824962261215843495b4c344db556ed0",
        name: "prysm-onyx-beacon-chain",
        repo: "0x28f1481f19514df1dce0ad81d9f89bf2bb48c59e",
      },
      {
        id: "0x55b8c11f727a188e211db9f9b1cf7c76ff647e860a33040d8cf900349fe3d34c42000000",
        Registry_id:
          "0x211a8eb316c4b5d95dfebfa2582e434afb597908bb86e58d189ae871425e8ddc",
        name: "raiden-testnet",
        repo: "0xde9b37b7267d237d4f87101cf1cccad2b304fada",
      },
      {
        id: "0x5bbe42863c54c92ccb5015eb5f630cbd89827d16922c955fc5c7bb20214fd36db0000000",
        Registry_id:
          "0x63534fc835316eb2f4efa1ca6d7292d50fd38692f19ae6d37c2be457d0ad1afe",
        name: "pocket",
        repo: "0x2b8647c41ef1315258da910062f74fea60619ee7",
      },
      {
        id: "0x60120364a6ab7457c641a5f0b83070627044311211348dd03c7c90d5f6ac7ed213000000",
        Registry_id:
          "0xf70c0abcf06c70681031f073925556b60f2fa942f161c6fe4ad89c65260debed",
        name: "dappnode-exporter",
        repo: "0xbf8cb94b14344e1711dc74b4d9360c1a6d088698",
      },
      {
        id: "0x6168be4f1a30d2499eb5ef4f55c212d608ab4d62d387aa08c8bf21857c46c21468000000",
        Registry_id:
          "0x0b7cbabfabdb9154bada1192c34ed6d29f45ab8e9923e9005798ec716c50195e",
        name: "trustlines-validator",
        repo: "0xb191457a257c1734f18608d744ddfd120979bb2f",
      },
      {
        id: "0x6172f0ed4e91c57b5d6c59b120369620a5327171cecaec5e8f7efab2d4ffa6f54b000000",
        Registry_id:
          "0x3039b3a3044c08514d8e72374e787c559e3782056eeee61c82e769654f3af2af",
        name: "bitcoin",
        repo: "0xd3933753cf3c6e378e4909f5568a701f7a1f46ee",
      },
      {
        id: "0x65f5728f71578f44339d1fbb94c2e58c539c9b6aabec67045141b68d65e5b01d14020000",
        Registry_id:
          "0xa10a504eb2fb6e8a0a3de7786b3cf3fff7e1988e21f3afcfb0c092c771cbd613",
        name: "gnosis-beacon-chain-prysm",
        repo: "0xcd58b683d616cf3baf38edf5965471c757a10fa2",
      },
      {
        id: "0x6b5f20385444fccce2896ea77aa22ff1649b07cadf3d3a4865e2c59949e8f77318010000",
        Registry_id:
          "0xc9aac391ff1a04268a09f4d9ff3578eb817273de2a48d87cba5668ee19959af7",
        name: "web3signer-prater",
        repo: "0x7e5b7076e8330104b846df807cac75575fd320d6",
      },
      {
        id: "0x6c24eeecf7c7cb1c7f8377c94839629b507819f628f2c3df4151e67bc3c7d74113000000",
        Registry_id:
          "0xf0fd18dddb6696315841e69e87e43596b504e77f22de394c760230065ac62573",
        name: "goerli-pantheon",
        repo: "0x1e9a82d2ff91b3c1e1ff7c7f2d62f6fb9f9c0684",
      },
      {
        id: "0x70cbf2ffe8efcd95ca15d0a93be8b409137ccf54c1aacd0e5b60e45a4055a38e44000000",
        Registry_id:
          "0x52134d305b74f5126e07924c9758bc1364660779088ac8d9686acb8a522ef29d",
        name: "ethforward",
        repo: "0x294888d97308d7ce3445d83d90268b29282863f7",
      },
      {
        id: "0x71121f7e4ee3faedc4e5c6e832dcddae894124e09bd66932f1dc0f0fd79dae5b2e000000",
        Registry_id:
          "0xb460b1983e28e2175f56f787f08fbd0e9efd60d29976e78b6c135c2cfad4d21c",
        name: "prysm-altona-validator",
        repo: "0x659725f88272d6f69cc23837dca26a738e59ac14",
      },
      {
        id: "0x712e6e39547d611b84f3d15739833b879fdda0d111138866e18b0a00727eaffe4e000000",
        Registry_id:
          "0x5282d48f4ce23ec701b768ca4f3606ae720287bf788024ceb3c3e0445e00ce18",
        name: "teku",
        repo: "0xd074684e3abaa3f8f210df3ec9290f045ae0dd58",
      },
      {
        id: "0x72f86b06651a4f36b0326cb82b9a10fb8ee950c19ac8e3fc76e8ede5cb95e3013a000000",
        Registry_id:
          "0xc1bea90834a069a38cf2d9ac689d2064a5c64604c7f76ea352d82b2eca00c48d",
        name: "trustlines-bridge",
        repo: "0x1e41779cfee567b7fac349ef0b5f5cdf3bda25b8",
      },
      {
        id: "0x76393f8858866426c9a996ac00e3d184d68dc3e95efebca2b4883a383c57492c6b000000",
        Registry_id:
          "0x8a269769afd971555fddda0d05b8a77c3cead95843369a632cbbbbffaf932e56",
        name: "ssv-prater",
        repo: "0xea6d433366c42faecbd4c604e81a138d28666c59",
      },
      {
        id: "0x7a9259a5493c8ea2de7ae8731fc6e2fb96308cc7f26753dababbf2a5f41a6a8a4a000000",
        Registry_id:
          "0xd6affa9983d13fb9210ace7aa13a8d650700cc848211235ca49e2d5f9b5e4ff3",
        name: "telegram-mtpproto.dnp.dappnode.eth",
        repo: "0x7043320c9b94d2a3630b7ae047185bed39b91d84",
      },
      {
        id: "0x7f62ffee0f9f6346b69431c8c352efb50fa5024daf4692cb290d23300abe05708b010000",
        Registry_id:
          "0x9ceb6df2a1345211980ff0d190f94440e8d09907735f21a92f48ddcd7ebd9de7",
        name: "nwaku",
        repo: "0x5d670ca64807332e5a1a3d1364c339fe0c472bad",
      },
      {
        id: "0x85a2e1b6606536540b6f98ccdaf88663861df16883c0201624bcd29b463025b921000000",
        Registry_id:
          "0xcd91a606a8abfa43ed3e9d77e6cb7b6326b90664502f25dd1b1e53b7dca48b57",
        name: "ethchain",
        repo: "0x30a933d920bc4a71a446a0f15f0e80eaf2383fc9",
      },
      {
        id: "0x863b24845de0a49b47cf88eb2cfff0a86396b16e209b559f953e954f82b9634f09000000",
        Registry_id:
          "0xd7ec73ef33cd0720e49cbc4bfb1a912840535bee540dcf01d1cc4caae0129631",
        name: "livepeer",
        repo: "0xf655173fafb85f9f2943b2f2518146a4c149c70b",
      },
      {
        id: "0x86c6652394a6c7779917e4e3c8712a5061c81317cd827d5a66ed45082aeac87ea8000000",
        Registry_id:
          "0xcd737f03196ad97210c371b4c3138e6a8b3c09e73f5314495b22bec283e08836",
        name: "wireguard",
        repo: "0x0ba89ed3daf7346d24289751c5e03d845cf0cfc1",
      },
      {
        id: "0x895665515373cadea4239aa46580e25c13cd021afe5e784c84f530b20edc7b6679000000",
        Registry_id:
          "0xd8816b6774b4f21f2470b62bff06430f58492c2ca27388734f63f14a180777d9",
        name: "eth2stats-client-witti",
        repo: "0x92e2ccebdcfd39413ce38dfd55c3674dca2c94b2",
      },
      {
        id: "0x8d80d3ec2d00002422d7c48651bf50189a9e4c462b9c0315a56951b6ebbf7b62e0000000",
        Registry_id:
          "0xe20caadbce45ee027acf5f6aa1100615f42e8d8c4f30b9d7eb9db80ee77fb45a",
        name: "prysm-sepolia",
        repo: "0x121de6c76d42595cf1065016d1f355ff63251135",
      },
      {
        id: "0x8d94a4e25a3e698dd28ff8373237d1f2c3d2cec7ae1ef8bd2ae4a83a0be37c588a010000",
        Registry_id:
          "0xbe5f91cba72ebc57232e0cefc3f0130600a06cba329932e12ce92d59d69319e2",
        name: "web3signer-gnosis",
        repo: "0x7c51cf7c7080081f10d5eebb30b9c5e22413c3b8",
      },
      {
        id: "0x904bca7a9692f7c3067f1036d617dee9c4affd8d6ab25142f295bd0862bc3caa50000000",
        Registry_id:
          "0x62e610907cf8ead0d5aa08fa34e0a3d023ddf8044e53130300042ebe333397b4",
        name: "vpn",
        repo: "0xe27438944187b49ef0005554a15b913b11baa08c",
      },
      {
        id: "0x91d9b7721c1cc362e4b545a8cc48d0f04a18234c71bd8843843b1d86d4b8e5c834000000",
        Registry_id:
          "0xbe70553cb1867c90aa0442dbce3311c7c598e6a6926d415dbd7a03b7643744a1",
        name: "otpweb",
        repo: "0xb4a284f6500d7f524f4a5c394d9da088d4548d85",
      },
      {
        id: "0x9234cdab22675e30fee2b68e17d873b1ab485f528a9a1583608cb43dff41607cb7000000",
        Registry_id:
          "0x3a8e290a30f186f0306a9a6d92280fd80ca410f3e4ea31060fb68b2d2ac497bf",
        name: "prysm-medalla-beacon-chain",
        repo: "0xfafe08a4385686ef6d83fe88282742a31b2eeaf5",
      },
      {
        id: "0x9272747ea795411fcfb3bea2e139886c06975f082d0a391b2929de9835e88e4f4f000000",
        Registry_id:
          "0xeda9efe85d4fbd1d808c0af5160741f7156c632bc503ef36405998eaf48cc4e9",
        name: "core",
        repo: "0xddf4639a18a74b199b6bfb502497effb50117707",
      },
      {
        id: "0x92e7c5dc8d455c2f5904439aec04b5ede1a63cac4bc5561eeb1faa18600da679ac000000",
        Registry_id:
          "0x059c245e2f90cb8b138639d1b572255b78070051732c431a90959e7c6e64c080",
        name: "mev-boost-goerli",
        repo: "0x696395c9cfd0cfe716ee077490d493022c5a3a78",
      },
      {
        id: "0x993d9788e440d8b32b7e7dfd17accc5c49123cd57f0809a8a395f217b1092b509e000000",
        Registry_id:
          "0x853fd1a23650d4a2676b1d3d5f1fffcc26e486141515146c12757ea2fecb49b8",
        name: "ssv-shifu",
        repo: "0x938e834cd50f5c70e592e46f1719777f5484a93d",
      },
      {
        id: "0x9a68dc258d3c883f9c60a587e29b8716c1ffa193d8bbe969b5929394c63c7ea7b2000000",
        Registry_id:
          "0x7722a288f4917aaa6c82c2f271a6e4f743b7ab9fdfd6fe8287ac46c10bd888bb",
        name: "web3signer",
        repo: "0x45c6d4e9ef383d100a8835fb9bea7703832b293a",
      },
      {
        id: "0x9f2afbeac194540e8159e92b959e8967e400356abf31f3c2ef009b18894f14f001020000",
        Registry_id:
          "0x781c07ccf579d2b5bc2d0222e2b1fe8e9a2a968600a9465ea179a586faf3e7ff",
        name: "goerli-erigon",
        repo: "0x0cc251d667d08495ed360bea63d0ad0b8a0e7c46",
      },
      {
        id: "0xa1ce5838e42756070aa538b366dc2276fb4ca421f17c03d4d9e9bbe9c02e493b31000000",
        Registry_id:
          "0x39a22fb0575aeb5f628ec34d90f27c917103698be802b74cfc82f8b66f83307d",
        name: "apm-registry",
        repo: "0x4f7d09e858fc7d39089e442a94483ee9995a09d0",
      },
      {
        id: "0xa1ce5838e42756070aa538b366dc2276fb4ca421f17c03d4d9e9bbe9c02e493b3d000000",
        Registry_id:
          "0x81c649d295efc66e3ce09dbb5253d31fc176b5b223941c362ca42a6111495e9e",
        name: "apm-enssub",
        repo: "0x7cba3879997fa1c780616eb0cfb47c79ac0e0f2a",
      },
      {
        id: "0xa1ce5838e42756070aa538b366dc2276fb4ca421f17c03d4d9e9bbe9c02e493b49000000",
        Registry_id:
          "0xa4c5b47053a13681e719fc386b13400c670cfc21e808e282739a3c54e7f00b74",
        name: "apm-repo",
        repo: "0x3ba9f37123cff968c08ae653139796d6f0c34d82",
      },
      {
        id: "0xa7b3b4671eb153314eeca3d34c8457745ede80a8433a3c736cdb69b410015feb84000000",
        Registry_id:
          "0xd948ada3c8a0d67e970497e8ee581e153c9a13240cf1bdd6aada99d810520387",
        name: "openethereum",
        repo: "0xde480e25200dfdcb2475869c0ea990c2741e3e7b",
      },
      {
        id: "0xa8de1d57f934eaf986d118f75c2cd7e0487e6c4b2b02509c94a0d1b0a6555635ed000000",
        Registry_id:
          "0xfb56bcb5dc6758f67c0a359b16027999f0ef8bbc91ec84c01463c5a2f07a209e",
        name: "medalla-validator",
        repo: "0x7cfedaafb0c3a950b4b9fe9289d44a4e5fd4d91f",
      },
      {
        id: "0xabe39459fa674577d4ae44acd3cdc85ef4208a976c81485e9f4ca3c94f5aa0ca7d000000",
        Registry_id:
          "0x6acb24e83fa65336891124bc29d472543ac4de1c59d51aa4f3829155f5d9a3e5",
        name: "goerli-nethermind",
        repo: "0x3fb3ca7df8b1fd76d7c3e65929da679b591c81ea",
      },
      {
        id: "0xadd18dcd81eb6c3034579ab14873e9f79eefdab917d12e9cb3747a247d7bce338e010000",
        Registry_id:
          "0x4acbd3139ae9e785a4421e3fe8bde9bf65843abdad103172609d62e7b5bbff9e",
        name: "lodestar",
        repo: "0x65db2d42dfcdbf7dc63317d7e5ccef8595534880",
      },
      {
        id: "0xae20a4f86014d453b2480ecee692ae9dd182c64000a88b07738844dcb09d4dd77d000000",
        Registry_id:
          "0x2e3ecc5ebebf071ec6ecbb0ce30267d59367ac69b8dbc2f7156672a7398e5a5b",
        name: "ipfs-pinner",
        repo: "0x32e1ef330df9840c4a689ba9affb22d6762aae2b",
      },
      {
        id: "0xaead30d658cd7263dab92022b05ee3673e212507935956cc95568e355928770c4c000000",
        Registry_id:
          "0x85cc445f2370e27ad032fd5cb8a36ba1ad74da27e2677fb03e835bdabfbb7ca2",
        name: "wifi",
        repo: "0xbb0fe4bcc05d83617ff29219e46a7834be9496d7",
      },
      {
        id: "0xafff4a39275d6c39a8613654b3a644fef803cc70ec2fd2684249799bf4b57abe9c000000",
        Registry_id:
          "0x0158125b76ed9c8b206a3e9a7d74fd236f31185caf60218a384a427a69578ae8",
        name: "mev-boost",
        repo: "0x34e4f45e9ea0b2eb82411e7ca15108265a189144",
      },
      {
        id: "0xb12029c8ebb4fdf7850c373719a5304afc17201ee586ceecef274954160e73f520000000",
        Registry_id:
          "0xc4b05d00e493206e5764db1b9b78e1327feb0a60ea7d8d2faf9cd666e8c2749c",
        name: "bee",
        repo: "0x67ad1434b6b78066d1379699f5e29919c2b7a260",
      },
      {
        id: "0xb1670f8906bbf1c404894a19ba7615963118d0912d8583529cd5db131dbc8b5f1f000000",
        Registry_id:
          "0x7b7d7491331e736fd597441c99888477186663492ab03d120b4556f27c6ce41f",
        name: "admin",
        repo: "0xee66c4765696c922078e8670aa9e6d4f6ffcc455",
      },
      {
        id: "0xb3f6eff98e7c128c6ffedb9a6c1d8bfe78d0f817b2f3212895e3550d7f15e4fe73000000",
        Registry_id:
          "0x765a75dd6f121e24bde6992df7916a6a077fac4d53fc244f5a7cc4421f919506",
        name: "testing",
        repo: "0xe4564de79f316b5556eaf1bdae221f3770cc3716",
      },
      {
        id: "0xbed7b6ae706b93c6532a48605f373001d048405fd8fd39479eaab08e1d859cb3d5000000",
        Registry_id:
          "0x9aa29687e6daa80dbb328e41b963b4946844b1ae9da89832e5d2908277779a7c",
        name: "prysm",
        repo: "0x4a114ee013cf54405b2950a7724a33d52600ed45",
      },
      {
        id: "0xc2589085830a93086ae9e133b613005a1e3d1b6aaa863631eec606d5e3d6b02890000000",
        Registry_id:
          "0xbf61be2bd8a8f82e2dc4d0a1fa52f9849e7a75c4de967839d39fbef38efd171b",
        name: "monero",
        repo: "0xe8332e80951c3020a5a8e529df01c12aa87f482f",
      },
      {
        id: "0xc3a64a396ec3bddca21f9ec5c5801f5762fa7e74fda1b68a02a25958bc5f67696e000000",
        Registry_id:
          "0x118bb804cbf4d540a60aec15c3277c2c31147ae9d34bb4f5173994218c0fef57",
        name: "prysm-witti-validator",
        repo: "0xdac11d1d37d650ea45f0c2988f17a06560a04a32",
      },
      {
        id: "0xc7eeff0a12dec7e5c7f9e892ccf181220d87f3d5abfddb4fa97b5ff451e323f46e000000",
        Registry_id:
          "0xf24fbba64dddbfb20d2196413811c2c380dbb802cb0c3561e1a35c0d8671479b",
        name: "turbo-geth",
        repo: "0x26543c453c3ce55f190bcffc2f416c70bc088d6e",
      },
      {
        id: "0xc7f015317081887c0d097b01982de4d6112cf4b04439f23a3df5c8783da207303b000000",
        Registry_id:
          "0xd7ec73ef33cd0720e49cbc4bfb1a912840535bee540dcf01d1cc4caae0129631",
        name: "livepeer",
        repo: "0xe56712c78e25fa29a8d195b1ec680c8ecfa972f5",
      },
      {
        id: "0xc8e5db976daf4eb2f916dcd5c2c1ce703a7ae424e474ae61c60cb2e3504aa5514c000000",
        Registry_id:
          "0xcba23ad7d08ccfaf05995a192a73ba6b3be054e8034eea75457b8c9dfa611571",
        name: "teku-prater",
        repo: "0x5cdf7d87a18b3bb4708facc8c5dd503ea41ffd75",
      },
      {
        id: "0xcbef57b91502e252abb460dc6da340f8cdab57b2cb4156e781e8b87362a04e9396000000",
        Registry_id:
          "0xc1d7647cd6f8b8e0df2b71f6627ba091e26e1f74ad7feadfc35002c22b7185ea",
        name: "lighthouse-medalla-beacon-chain",
        repo: "0x41d5c68add2268d3045f07e8831960f0f7a859e3",
      },
      {
        id: "0xce16e34f0ec0295621c605f19ab0b6f1364a99609acdcfe9b30f02167c0439d469000000",
        Registry_id:
          "0xe087abe24b561558d26978389cd2caedd6f19dcf89b703fdd6d5dcf528b47315",
        name: "raiden",
        repo: "0xb5bd9c43ab31a83d0c76be26753fbb8efeae14c2",
      },
      {
        id: "0xcfb7a39aca912e94066380ac9f1eae0a9c75d8761dfe93d1db7ba785601b7e71c3000000",
        Registry_id:
          "0xc36d7ac592a0948098ad6c8c9916f998883f82f49287104ec70e5fe14dc83b3d",
        name: "eth2stats-client",
        repo: "0x628e382842662fc232ce73853ae27263b78cf3ab",
      },
      {
        id: "0xd31c89c27200f2b9900c6341587d881f1e29f33ed1679e24b83ceb411d56024076000000",
        Registry_id:
          "0x4b3f1349cdfd7c9f73d80a5d2ae0c72b10d4967acb12019e5d5ffe18bb2aa1e7",
        name: "kovan",
        repo: "0xc7748be3246ff59ba8e3ada63fb4c42be39deb81",
      },
      {
        id: "0xd5cdc51bce86d24c0c89c45ce5cc7948245cd8b2d6747d4c54ac18b0ef77083e38000000",
        Registry_id:
          "0x5d0d4a46139c099db3f16c7965db77f601fbf2233dd1d2275f8eaa19041768b4",
        name: "ipfs",
        repo: "0x9dc9dc601f8f177ab558bcabde71786f1ea84091",
      },
      {
        id: "0xe1073e40b8638757e128556b295006161f2fba943296507438c9657f7ec3bbc55f000000",
        Registry_id:
          "0x51b3210d98a3f6952a0c13a4b3448758244213b84b43104383eca8272e539870",
        name: "dms",
        repo: "0x89c7ff83490562735d5aa2547390327487219c8f",
      },
      {
        id: "0xe300fb0bfbd00be01efca67b63076647afdffb27cd434c72d9d297256d1b43b02b010000",
        Registry_id:
          "0x77941c878845bad39b505f9298b634dc7e01bda3cd191e7b72c38e3ff62fd151",
        name: "lodestar-prater",
        repo: "0xe74bc1c4c27284ab7dbcf55f71fcc04b832fc32c",
      },
      {
        id: "0xe5866770f8fff8fa270f13d8afd6dbdf1226a167baff0b04931f8f2066c9225440000000",
        Registry_id:
          "0x377022fdf542b656429e5f3965f4cdc72bf5241aa27d13209c1f1ec0c06ef5c2",
        name: "trustlines-netstats",
        repo: "0xcc9a190e06531bd6a68ce14e2e2a87f75bfe473f",
      },
      {
        id: "0xec963a56aefaf162b433409057cbd131f11dbae12a79052a61e68af5149592a081000000",
        Registry_id:
          "0xda235a125d9ca6ea8a4e604040242bd6dbd02e1f9e617cf55dc99c810a090e83",
        name: "lighthouse-prater",
        repo: "0x66b1eee6f56b8b53de472e5cfe2de420e9fa6d2e",
      },
      {
        id: "0xee1a9a18a65b3fd4663c3d43cce98f03f491c44976f828919f8121a1774cc5cd90000000",
        Registry_id:
          "0xc384a04c1a2d256e095a742097d080f9daaf171003be0741c37daa511f668bde",
        name: "nginx-proxy",
        repo: "0x0a4dfbcf20258a0593f44539307a96bbfc9b1273",
      },
      {
        id: "0xef2dc8d73c5e73197a044bbfcfe5fda177b64e016c276ecea63740419536a476cc000000",
        Registry_id:
          "0x30d66d48c23c8bc4558bf92b49f5766d0e30982bbb6fc96ee04f3f47c7791e5e",
        name: "erigon",
        repo: "0xda33da12e19a3579f1b522d0d215d2333431173e",
      },
      {
        id: "0xf307ed2f9bd08fb82f6994ad3ec419ad4b49a6521800ed9c1f7a20ef7b05db4e55000000",
        Registry_id:
          "0x1b9bd7546b166172b18b5f4cbfbd4d76ca340c60a698d2813f1b375135057894",
        name: "geth",
        repo: "0x6c4a0d357d8f590bacce42a4a497835beea2967b",
      },
      {
        id: "0xf329519b9a88c2ad5b82da769cf3479c48858e1d0058b5118c8eae61615cd1be1b000000",
        Registry_id:
          "0xad6826e119f6a15caa9eb1c5c450c97ef03906b26a65c04c822a1cf0b9cdefc1",
        name: "lightning-network",
        repo: "0xe1d145eda2845e0917c305525d8ee7cc208c0291",
      },
      {
        id: "0xf5b099322884661a27f856aead161decd5a51e7a78a7a8ecf432505ef8c25e1a79000000",
        Registry_id:
          "0x3bddda45e5dc2f281e3f95ff516eef398df3c5e61c8476c9d78d6b1c639ec673",
        name: "nethermind-xdai",
        repo: "0x18da083461d863cc4d07cc7187093f18f2b8b860",
      },
    ];
    const contract = new DappNodeRegistry(
      `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`,
      "dnp"
    );
    const result = await contract.queryGraphNewRepos<"dnp">();
    // registry new repo may change
    expect(result).to.be.ok;
  });

  it(`should get public newRepos`, async () => {
    const expectedResult: PublicRegistryEntry[] = [
      {
        id: "0x0060cb7c75f6bf1709541b92a8c7482f2c2ba62e62dfed90bcbdfb763465c5277b000000",
        RegistryPublic_id:
          "0xdfbffba6b77127998fe966ed99c6a0a4086a70aa9b8adcae96717555cdf1ab4f",
        name: "prometheus-grafana",
        repo: "0x60d6d8e4a0caae207305acd561b419f9fa52774d",
      },
      {
        id: "0x063aa12ca8a67f4f26e6fcb41f9b2cb8c6622abb8bca9c47a4fb0235688e4839fa010000",
        RegistryPublic_id:
          "0x5874fdc0c04e41c7d921b4e5b625448c864ef6f74e4cb33e0bd5ac98824e6ce5",
        name: "arbitrum-goerli-nitro",
        repo: "0x4c58370e1e59d1bbc3e53d82e34079419ab8222b",
      },
      {
        id: "0x06b06c0f5ee2303587930d1e8eb2cf4c74e7b30eeb76426406c8e0dead0bf79686000000",
        RegistryPublic_id:
          "0x3ea5960b6fa189bd8f560d8327b7ed5427766adae2d55dd15b309bb7276b2cb7",
        name: "idchain",
        repo: "0x6a111e20889ace99ca14c1ab38cf6c1176ed0ae7",
      },
      {
        id: "0x07be6040275416e9e4b0226a4d56b551d4fdb6b23d252a30eb432945dc5fae48f6000000",
        RegistryPublic_id:
          "0xfb0bd03ce8a906bb414bb72e37f5c943486d19b317eda9439443c38a9a8db246",
        name: "storj",
        repo: "0x1cdcd287551ceb32e3c3a3e4b79d66955a6663f8",
      },
      {
        id: "0x08a3d5b23c816125c9f2319462729abd2edb7469cc6c3424e537474417f26f8f17000000",
        RegistryPublic_id:
          "0xb8bded069548b7d081b51da8c36cc4e9330b3edafe4b008be5312cbbc2d4bb55",
        name: "fairdrop",
        repo: "0xcccbee234112c5ea3370fb707875a8b1cf6b0fcf",
      },
      {
        id: "0x096b97b5f4b55a54d74e20c0a04ca3ebf201d767d2e2f72fd9e4342d1fb33ebd48000000",
        RegistryPublic_id:
          "0xf42d3a33e6a783d0973ab675ee4281cc01cd0d3308756dadd438825743fae605",
        name: "substrate-telemetry-backend-archipel",
        repo: "0x7da777dccd882389eb4a0250eab9ec8662baccfc",
      },
      {
        id: "0x0c9db52879386dd9b39121fa648e273a2c4efb5e0f0a00319b70ff635e94e09876000000",
        RegistryPublic_id:
          "0xf2df3f27822bb32630e5fa54a8e5758a36158d5d52cae9ce600fe64e59404134",
        name: "goerli-tesseracts",
        repo: "0x423d2c4c796df65342825d241a42f5ae2aa5d2a4",
      },
      {
        id: "0x14e6a6b9601e7dc0be094979fe9f1502bb4a130364c053d7539125b140c97bce8a010000",
        RegistryPublic_id:
          "0x19a7b86b1f6f637caebc27a8a32a65709b2e04799ee14728d2264c69fb2b2ae2",
        name: "besu",
        repo: "0x2914045962c6ea7706311d47937be373b71a6060",
      },
      {
        id: "0x180b2541e0290042794da83796576afdcc9d4098ad786725df9f2b07d0b11e1b86000000",
        RegistryPublic_id:
          "0x654e3054552e5b0775771ec4036d8f2615992fe084bc79ee4aa80bbebcb49ba8",
        name: "electrumx",
        repo: "0x91a3f013e85865b204f82b5781304b8fdd496437",
      },
      {
        id: "0x1910ef69d27b9e2699acf3d3c4b6a9c1884b76ebe2908e2427cde782b4981a5b86000000",
        RegistryPublic_id:
          "0xf3ef98476d653210498395a327673cf366713c81794d13117c7b02793723fcb4",
        name: "folding-at-home",
        repo: "0xc2e7efb1f61928ce8233157f14eb2e4254666895",
      },
      {
        id: "0x1e1d2ac009359c57097d8f64559d60f0f6d7dc6daae77057b3c3b1b3be2de66c43000000",
        RegistryPublic_id:
          "0xe0ad00fb6639ecea337783025acf996fab99d6b9dcc50c643df8cff77ab31785",
        name: "dnpinner",
        repo: "0x4416e22bdbb60e334793b16e9427a8f1305f0a9d",
      },
      {
        id: "0x1e2ef222d719f752c6d63839d25b174cd12097c818b476e9429b941c189d9b723a000000",
        RegistryPublic_id:
          "0xd48d95487bcead177b4e56f7b83f269d4798e6466b41e0a6df64c875acecd8fe",
        name: "eth-net-intelligence-api",
        repo: "0x794547e50bdcd9f9a52367e7850ea4474504f644",
      },
      {
        id: "0x20510cf2873338a2d9d981328bf61b68d036ce0162276dad811ca9a9cb7ae9014d000000",
        RegistryPublic_id:
          "0xe9b0284983c520ecae68bd1be6da545cb65b573b5bb24b9883e38fe8bc71d324",
        name: "tornado-cash-relayer",
        repo: "0xff9adbe8ee786d420a826d1e1e67723eebb57696",
      },
      {
        id: "0x2f4d1af2f10a8570504aefd63a88a8f2f855364b47226958b25d5c324844596e38000000",
        RegistryPublic_id:
          "0x2044ae55bc99122aaf5d88f341d45d3b149c2652de7451afefa892ebf3e2dcd8",
        name: "dappnode-exporter",
        repo: "0x3b1ff62fbf38676f252aec4af3262e76fc67d49d",
      },
      {
        id: "0x349ad78fe80beb9072e071ded7d805ca8eec9a86683c6578dded824735981f0a0a000000",
        RegistryPublic_id:
          "0x300e75fec2f9e857de1bdc19ee4039b619484a05db38dc114c23f91916385757",
        name: "pocket-core",
        repo: "0xe504aca1f31b0528fdc2afcc8c411a606032bb58",
      },
      {
        id: "0x365c4d30d9779ae954ce6acdbc6945bb4173e2511ea943611ed956004618b8d61b000000",
        RegistryPublic_id:
          "0xede25ba125ccf87121ebf03741d723a9d8ecd34d976d22cae9f9f3fd2f6eb801",
        name: "jbaylina",
        repo: "0x1abf8d63ac29be2a8c3411901b3bee6fadca2dc4",
      },
      {
        id: "0x37fcdc918a5109a636ccbe1e94be0d9d5b914eb8cd34ac82791d8a65bb0aebb788000000",
        RegistryPublic_id:
          "0xb65f0ce53546196631dc3a0d3bbdc77677ca672cb2dad349744b7a978f615713",
        name: "zcash",
        repo: "0x191b717c27677b3dc8903230030b6747614c45f5",
      },
      {
        id: "0x3854eb848afaa62ac5f01be2a36e6a5e7e3ea9ebcfbf1a888d2faa89da23394e89010000",
        RegistryPublic_id:
          "0x176edbac616a3f518ef1f8aed1fb211fca61fb4e388b3ffe2cc45578ef9e84eb",
        name: "lattice-manager",
        repo: "0xe4d57492fdead3cb12479deef739423fcd991418",
      },
      {
        id: "0x3a9dd7e13f8a387fc586ccec66f8f158db3d494e29951a150205e267860e11d017000000",
        RegistryPublic_id:
          "0xefc18b41f974511ebf129603fa51460408177267c8c91188221096d51c683781",
        name: "archipel",
        repo: "0x8b5a1c3b8b265eb46ac1258691cabacc16e53911",
      },
      {
        id: "0x3aa1e29cc8578c9ce7f629fdbee79d31b7e0b7b7dfded4552605c67c752651de1a000000",
        RegistryPublic_id:
          "0x76502845712f9f2f593283fdde430f8cfb585275ad70c362e4c05f6fd2cea125",
        name: "archipel-ui",
        repo: "0x2252c87c7f112ffb003bf93f998033751eb80961",
      },
      {
        id: "0x468c4dc43822fb4ca683101841b179f137d5ab1a6371a9de323100772c4bb5e734000000",
        RegistryPublic_id:
          "0x88d93ed5a0bb239756ce51f7ef41ce966142e4f0bc7890c13eee252d4cb2713e",
        name: "turbo-geth",
        repo: "0x5448a94e65c01d93d744a5cdfbe6829f475122b6",
      },
      {
        id: "0x493e150256c7cba969b5eef106c1feede646973522ca20e6b9328c9a72da1d792f010000",
        RegistryPublic_id:
          "0x7ae832f578ed7e0d61e81bea8e0ab09718e1ad4826b9eb1f7cbd8c99a57e1990",
        name: "qbt",
        repo: "0xb1b89dfd740928e1f9cafb9265166f59bdc83f99",
      },
      {
        id: "0x4d32d8dd2ed1478e31301b58bead5a1022105b60a22ae285047f86dce5f307c78a000000",
        RegistryPublic_id:
          "0x8463d013246eae60a951a75b05882dc07160e707d0bce1f32ecd7294f5539b20",
        name: "prysm-validator",
        repo: "0x6d7c115c59050a3ce70a9d656e72d366fae7fbf7",
      },
      {
        id: "0x4fa8724b45059bb6d8b5a1c1016f191496ca1b40e4275108d6ab3a3b7c974d6057000000",
        RegistryPublic_id:
          "0x4738de0dd23189be7a9938f8d474e182cb5d7bc73e9f4d6e10b1ccddffdcd943",
        name: "boinc",
        repo: "0xf560d3adcbbe4db77fcdca8908cd520e25add2b5",
      },
      {
        id: "0x508478ce46c94cec853361d777feaed6bb429ff909d53bca44f97c09f4a1d3d62e000000",
        RegistryPublic_id:
          "0x2e3da36a87d14fb6b3e0a7c6baad472a411d1271529917e75c4de28d6f46e9f3",
        name: "masterethereum",
        repo: "0x1b66cc0563e32f60e929bff26ccbb7084f98821b",
      },
      {
        id: "0x530ea0fd11b8efdc0a5650bb42fb23e50cfbe42d2a5b336c3318758d6dc4b12269000000",
        RegistryPublic_id:
          "0x095cfc351c68430de9d95f3cdd0b812de7957ce14f57d912e7b92cfb52e9cdaa",
        name: "beaconcha-in",
        repo: "0x5a46d6570faad1b26d1b781250b61ccb675bf14b",
      },
      {
        id: "0x5734fbc1c3e3bee05d0cc8d596944a8f8760f9025dd41796becea85b0ecc342a47000000",
        RegistryPublic_id:
          "0x3edd3f0a3d24b46952620b07db5bfba8813963f1bc5f0dc78a7d41967d01242d",
        name: "goerli-parity",
        repo: "0x41de16c78bf5266867c6af6e03d278fd1a069177",
      },
      {
        id: "0x5d7e106bb9ea0ca8d5480e28b436d62084a36a42fc6b55b6c7a4e8a936efaae795000000",
        RegistryPublic_id:
          "0xb0816cfe3f32ac701d9ca86c9354c12bd63395f2b1c2fd4b3b2f6ab2c8a7e872",
        name: "prysm-slasher",
        repo: "0x5f87efb1ad3a1d49ca2409826efe91ed977785fb",
      },
      {
        id: "0x5e69e2b28102e5c362fc25b50401c97f5d1c7ff7428359362cbb88e0ed197c6823000000",
        RegistryPublic_id:
          "0xa7f85013ad85a776d2c6f1ee1ed1863039ed830679afbb30f0d87d5f4ee02838",
        name: "dms",
        repo: "0xc1b9badd7abd245906009633f5142da8b2ca63df",
      },
      {
        id: "0x610396568d645d89769a59fc0f8625566f41f4aefffacd6b66897f87e9e4c03648010000",
        RegistryPublic_id:
          "0x00633980dd5eaaf6381a9ccabbc83d90a919d2bdbe17f6c95cb6f44904685d81",
        name: "otterscan",
        repo: "0x59ac053e74bb551fbaeafe0fff44db260de083e5",
      },
      {
        id: "0x63b89b645b77b2b825b4c7f1dd0a6e454e48c91d359a30161717eb275bd297d42e000000",
        RegistryPublic_id:
          "0x4741ec43fce74299d35e17b9c1b0765a7186e8440d49c9afcd8d6f7f5355d80e",
        name: "peepin2",
        repo: "0x819b63eb2478a0b2e0ca95c7f9a1045dd59cbafa",
      },
      {
        id: "0x64b71b64ce94e6b9f70ad0047ec22dd2a3833e38b5e88ab48cdff0563e81bf8107010000",
        RegistryPublic_id:
          "0xe88dbce2661e96e090b4faa85ef3427dd1c78b439c114f92b43561eeac02b246",
        name: "rocketpool-testnet",
        repo: "0x43bd2716bcaefd5943b6d85a7d41c4fea81ec23c",
      },
      {
        id: "0x6f2144aeeb510af217af014ed80cf8e6d52687f555c38788d38b2de63ef97d7527000000",
        RegistryPublic_id:
          "0x9d499a31ce9ea389a2c41b946bd8d3ed1ee3a5e8391df85cc21c50d542c76ded",
        name: "nethermind",
        repo: "0xf9a848b81d4396941375fa96ae279b7280d103a7",
      },
      {
        id: "0x7170180dd9c04a99f7e50a08b443a949f942a2a926c28141c1ba171da9be4849d2000000",
        RegistryPublic_id:
          "0x9947d4a7d63c41c341fe5851e3415833bb3f187c77dd1972356433b6b58d2b4f",
        name: "etc-core-geth",
        repo: "0x18d06d162540084430145db8ad2f63eba93766b4",
      },
      {
        id: "0x720742550fce12a984f6a1cd418e52445c9578c6e4eca817d178bae41af9604e41000000",
        RegistryPublic_id:
          "0x3483406044a09734cd2b7e7a35c79c7c9c244a5c479cf1ef544c1bbfbefe2a7c",
        name: "bitcoin",
        repo: "0x077d271a3e4c3b45358417142490bd21172c81b5",
      },
      {
        id: "0x7297c8346857c3127a2d58fa805afba27ec73d55936f06b1bae34ede61060f17a4000000",
        RegistryPublic_id:
          "0xd33c42438e7de747220fb6a3c6008dbbf80688a504e7d6c17595eea2fcfd290b",
        name: "juno",
        repo: "0xe01a9f110bc3e17288784664f8b8d96b23ac21ff",
      },
      {
        id: "0x73ed8b90d920b306fac52a3f5e2227a059409305f0e074e865fa75a4305732b00f000000",
        RegistryPublic_id:
          "0x89a6caf4365707d18498e07bf8bc0989d89a8659db32646aa8318b6b57ec9750",
        name: "pocket-core-testnet",
        repo: "0xa26eb30960d7c6b3a015f598cd840c8e5a7ffe28",
      },
      {
        id: "0x75f8acac23c72410c1bb19d859465b0d67262b033d0b480167cf2238c018cae216010000",
        RegistryPublic_id:
          "0xe04cbbc33b23f5060b6fcc9081e8688e9a80f7fb1fd0e1c25208756284f93801",
        name: "mev-boost",
        repo: "0xa8f41112dd9536c92498c8f8aeb2c8ad5a9ffb75",
      },
      {
        id: "0x762f847028f9b1d631b4b2745d1af00e979c9891257e52373bbea5b140332c0608010000",
        RegistryPublic_id:
          "0x3814d938a73707b8a29b64900c2c4c2f102c6e148bd93e0453ce802b89bd0d42",
        name: "polygon",
        repo: "0x1148e67dcbd11b63bd53e45dc4a9565c0ad66a7c",
      },
      {
        id: "0x76ec638a1fd642976274d501460de73e0eafdd90817e70b672e538718975ba6d17000000",
        RegistryPublic_id:
          "0x424563bbed4a267a3338d9a5772c5671677042c6fdab1d992fe3b2bb84593163",
        name: "trinity",
        repo: "0xee09d2b1772495028939cd8cee59ca0f0bc6bba1",
      },
      {
        id: "0x77caa63839809d48f2c053d3eeb1d576e2c19c427528835e7aee691a39f8e8820a010000",
        RegistryPublic_id:
          "0x729031c2dd7d4957283cd025d1361fab550e09e0a327534356ed9c7d4889152d",
        name: "kleros-data-pinner",
        repo: "0xf987d43b3ee74d05483c95532cccfd47c44d22f9",
      },
      {
        id: "0x7bea8688dfd2bf8b1076734d79ec9035bade1c37d6d47b701508512a72e0898b31000000",
        RegistryPublic_id:
          "0x3df47dab5020df979eeee8781280685b0b90985a44311f85a10f7b164f984128",
        name: "artis-sigma1",
        repo: "0x955271c5e77d7bddcece0e0c8d48470a699b372f",
      },
      {
        id: "0x7d06a032d29eaa73d28eaa3e4ac56a0dea2c8d46f807015addd73bdb451f80498b010000",
        RegistryPublic_id:
          "0x6f0b5d58f3e4e612b99789453df930448d0800ed6bec6a8cf7af4e085329b2fe",
        name: "arbitrum",
        repo: "0x0fcb91de9ab1fe0865de768c37408ed80786545a",
      },
      {
        id: "0x80f2c32e8e03ed8949e5a279d9154f390299ff8bf9b4cfa6e05821d1f89e3bc8b4010000",
        RegistryPublic_id:
          "0x4f9767f03cb2007b55d4483603dfbef1aa8916b8cf424a82eccc7139f7942e7a",
        name: "pathfinder",
        repo: "0xbadbdc6636520c3f30904aee82abfbc440abed02",
      },
      {
        id: "0x8a87b1252964bcd735013f7a12d71c45893aa7171fa2973d62dce31b80f915f457000000",
        RegistryPublic_id:
          "0x6a5699a502e5914239605cde5bd114545c56cef63bbac3a3f5783844226a99a9",
        name: "timenode",
        repo: "0x2ee525f1ae6c822d4205a915586616524a9dac1e",
      },
      {
        id: "0x8c6cdf7cb902d216e1e7d1bdffcc7d38fe982e5c73670b03d856f0b2a0335e6c8a000000",
        RegistryPublic_id:
          "0x9ea49c0bb9032bd627951e8229edf55dad45620027432d93fcc3cb6c5ab3b04c",
        name: "swarm-testnet",
        repo: "0x38f810c9c75875880929e88dd2a2a8a0b1492fcc",
      },
      {
        id: "0x92bcc85d5ebc7c0553a66f17dadebd3fa354f3340cfc85d94ef30751387acb6d3a010000",
        RegistryPublic_id:
          "0x819e34ee2c6f4b768dace1c8f9c8b581714e9875840fc884494f7bd23b9782ca",
        name: "etc-mordor-core-geth",
        repo: "0x74d5836080e293c21f861dcada090c61cb264cdf",
      },
      {
        id: "0x9345aee9f037ae53ce49581986eb883fb21d1f41d379135d5053aa17cab813985a000000",
        RegistryPublic_id:
          "0xa3ee958bc8c2f13a08bf4016ce3a82c49058510cd22926163f916299b8840a2a",
        name: "avalanche",
        repo: "0xc16e0ade30ea8ad20acec5d529b2cb139d61137f",
      },
      {
        id: "0x966b331ab85d2c91e8abe01495938935430d4bde5bf9dbdcf4b16b3f4d3f504175000000",
        RegistryPublic_id:
          "0x89d94b646ff69ce15865ee9778fc67f80f9353373fc3ebf4d571b43c40d77b96",
        name: "brightid-node",
        repo: "0x4b214a2601d103fabaa8e94f06e924960bf4daeb",
      },
      {
        id: "0x9983c34965cdcf9cfae9b3b19d66cf442541548edbfc18f384cfdb09cabbccfe80000000",
        RegistryPublic_id:
          "0x9e20c2fe5c670e9fbe99df208242c3895e89203c73a221601ca89c594c9ac097",
        name: "x-core",
        repo: "0x6fd0f511b92d9b2496f594d50430d18387658eaf",
      },
      {
        id: "0x9a994c554733440b9d734f47de90c312c5df54f3d96bb8510ca3715c818d3e6d8f010000",
        RegistryPublic_id:
          "0xdb4a8fb35a37e3339d2bb84eece60b496188665c8e85e0e16dd813405c9da726",
        name: "optimism",
        repo: "0x891b7046915891471078f8e5c755f06f93ede981",
      },
      {
        id: "0x9ad73de42f059058c24db5f372b0fad549c79c7e7da84f558a87a3ee97f327566d000000",
        RegistryPublic_id:
          "0x584937b15aab5e55440517e30948901ef406ec7c5c0702fbdba158427c47e35a",
        name: "polkadot-apps",
        repo: "0x9d8678831b12c94d2745dea3356a59cd07c228fc",
      },
      {
        id: "0x9af50a39d7f71ebd0b77ddaca344293d084ff75b42fcc7fc1384e8081cb5aa0c19000000",
        RegistryPublic_id:
          "0x41d14451aef0575d614871b359b2a1d145db8920e9bc9c08e4f790d7c431cbec",
        name: "nextcloud",
        repo: "0xd2a93a02edd3135fc1acddd511a77eefc613f061",
      },
      {
        id: "0x9c53ad65ac80d7a7c6f650f3ef4aaef9dca27bfe05215792f1adf4273936682eb8000000",
        RegistryPublic_id:
          "0x91c5123919c6dcb23588712e9dd37152b9c7c98581ef7db0269ce79c598248e2",
        name: "lattice-connect",
        repo: "0x84759fd996217fa7839756881040e23c6f9b26df",
      },
      {
        id: "0xa2f7f8ceaf3b843f738b9c332683ffe9a5386c45dc28aff9a07540eb63031fcb1c000000",
        RegistryPublic_id:
          "0x0421379892ba6ddbddf8216a9adfd5fc0b97a31804291f44f5af07f9a38f3922",
        name: "eth2stats-client",
        repo: "0xfc2ac0e8ae8a4daa678785fb9af34673e21cc9a5",
      },
      {
        id: "0xa93e49229fd4ba49a64e3436d0adf678edc9decfc06c72445afb32b6d83f357577000000",
        RegistryPublic_id:
          "0x55cfa467689f95088f0cbea7cf28725e809228b3ee7af8b749fdafd6a917c0cd",
        name: "polkadot",
        repo: "0xcd870fa2f92978e64626ce6b24f2e2d39d04c189",
      },
      {
        id: "0xad507a4141f327bc8df961460154872ff122fb897ede5be843833c889d5472547e000000",
        RegistryPublic_id:
          "0x4c381d6532c7e1c56c28121ff08350f430362429e0ad509d74b98ba87e62b516",
        name: "fairdrop-network",
        repo: "0x1d31bd9b2d6cc17873573dbb619d8b79f7cd390d",
      },
      {
        id: "0xb11f749f5b5b08cd815fa71c9bb9e84ecf4ec454d01b44aeed2645bba0f70bda53040000",
        RegistryPublic_id:
          "0x426d56a5f6ac24752190619172605d4eaa406f49b8d5dcb422aed759f414b69b",
        name: "swarm",
        repo: "0x4a96d827c232b69dbd4d723236cfe2dae1659d0c",
      },
      {
        id: "0xb3e26378b7a9a73572e1c157a2ea0225252673d00e7bc818f612504359f67c2d2a000000",
        RegistryPublic_id:
          "0x55382c39ef7805debeeac4bae1f8fb1a4ec5f82b2d05b5d4a0490341ae13731b",
        name: "prysm-beacon-chain",
        repo: "0x1c53d47b8d6e3972fa5c9004a9c4487da9a34e16",
      },
      {
        id: "0xbbe2fbfdb36270223b859a02a93da7c42aaaca0291d0a328a43d543a4959a90b6b000000",
        RegistryPublic_id:
          "0x9301f322adc05229f1d962c2408e55d758a17848ee0ef384c95e0a9cd1edc746",
        name: "big-dipper",
        repo: "0x554c59c113affa829737af2abab1da7ab366f6c8",
      },
      {
        id: "0xc04b4ab9d158ac9ea05d5f23f093698c2cf9e63d2fbfcc83f8a4e46a1d5086b1c0000000",
        RegistryPublic_id:
          "0xcad4d6870dde3fad5979a7c89db790b7a0a53ed92770fc340475a4bd33f426c8",
        name: "arbitrum-nitro",
        repo: "0x68a5b4ef4f337bb5442185f398242dd68f80348d",
      },
      {
        id: "0xc6cb2832588a024041f3f6e873145b88341ef3190c45efd49f05b4b622b725b633000000",
        RegistryPublic_id:
          "0x9106f04e8219cbdc545f8f30bbe7edf08085456e4145b37d336599363c13957d",
        name: "substrate-telemetry-archipel",
        repo: "0xb73a74d7ecc33749d9fbd7856ec299e4e3be33cb",
      },
      {
        id: "0xcb6a2ee43681a54b7d32101d118de134400a55b01a1cb4531f36b51da08d98345c000000",
        RegistryPublic_id:
          "0x420248400338911588f8ffd4762bcbef9822b0170233aaf3c655340343cb6791",
        name: "sentinel",
        repo: "0xfb395b2d4d5a394a760e2426d07a1699f166c4c9",
      },
      {
        id: "0xcd92a4a06107745e8ea65ef4a21a362851909e09fafe2efaa8adf678461100260c000000",
        RegistryPublic_id:
          "0x3378cf5538642602edc8896f57cb032a6f55ea03daa28603bd552efb88d92dc2",
        name: "ethereum-optimism",
        repo: "0x433772b03c003b7e2b66b4590025ddf54ac33653",
      },
      {
        id: "0xdabc8d64acc92b6e9bc593b82558346f825a5c43d7a170bf6e5033851861872503010000",
        RegistryPublic_id:
          "0x20aa50be6de299663ba6f00a356dd225ccf030c4010538bf09d0f30a87edda56",
        name: "hopr",
        repo: "0xa2633b5e32d9a0e3266afc2e7f73661faecc849c",
      },
      {
        id: "0xdbe1f03c040ac31a8a3a81b9fe4c48139b186de0c1a51d985ce16da2d22124b112000000",
        RegistryPublic_id:
          "0xa28528bb79d2df4b7793f20145ff7de583803dc2d800e116fcd5b74ec3094272",
        name: "lightning-network",
        repo: "0x544d3606a85d32252b2b63d80b110e5be8cec38d",
      },
      {
        id: "0xdbe36f2243c92973643005a58621965c3d89de63e75c8b39652f2f9ef1f3aea95b000000",
        RegistryPublic_id:
          "0x255a3caafe191a501b64c2025b5a20c5c6a2e71b633f9fea49cd8178a0e006e1",
        name: "cosmos",
        repo: "0xa08b11ee2f258a9ba9db5f97f7f4e488f0cbbc84",
      },
      {
        id: "0xe6efae915f3560e15841ca3c1c7f6456e06bea7d2e1c0bab833264717fead4da4c000000",
        RegistryPublic_id:
          "0xe96a18415514175364080e4b66e9b207bbd00d8c732b60edc74a897c36b86c42",
        name: "status",
        repo: "0x0545c8d8537fd8b5d8b5cec24ca94103bd4b67d4",
      },
      {
        id: "0xe93444d82c732f13901cbe96adc427398cf1738a87377fec865df1e5d8799d44b2000000",
        RegistryPublic_id:
          "0x5be3e3686c148f2af15b5fcf345e991ce7d97594da617407a1a528a9765e7045",
        name: "binance-smart-chain-node",
        repo: "0xec2a48f81a79ad576160f14a541aff5fc4c997af",
      },
      {
        id: "0xf1f9fecd1f007152ba5c68fead1b5a4cf3405a373e0c6dd5f4d8e84bc8968c402d010000",
        RegistryPublic_id:
          "0x1d7b7c0789c9ca88bee415348984bc54d0ff8d611a4427d98dbf870f0d241e99",
        name: "dshackle",
        repo: "0xc1a00e2034af823793e161eda12e09265b35e560",
      },
      {
        id: "0xf918268783df5dcf0ff2d51c8c7c7ee4f10f8ad88c76e24b1d685985b4eb333338000000",
        RegistryPublic_id:
          "0x7db97bb73c17a657380ffdb8156793286080a2944510db84d1823dba3d7775d6",
        name: "apm-registry",
        repo: "0xce1cf6b6f671da234a869fa56226b6168a3e37d0",
      },
      {
        id: "0xf918268783df5dcf0ff2d51c8c7c7ee4f10f8ad88c76e24b1d685985b4eb333344000000",
        RegistryPublic_id:
          "0xb2a498e79d93eebef76b83ab3b01361614b2492c425bd77c919d46d90b852481",
        name: "apm-enssub",
        repo: "0xb68e4ddcf00f93a89430ab2e4f878724ac7c23d4",
      },
      {
        id: "0xf918268783df5dcf0ff2d51c8c7c7ee4f10f8ad88c76e24b1d685985b4eb333350000000",
        RegistryPublic_id:
          "0xe1792093c1d9aa8516a6ef6dc1a5b896ab4a79633a338adbd0fee119643e1d3d",
        name: "apm-repo",
        repo: "0x9b0a3840dd25e9a9e42829f9c0cadd34bf983da0",
      },
      {
        id: "0xfb21b10d6bc3814ed294491d6fedbcd2facfe236ee90726b34b41d8bb27993e911000000",
        RegistryPublic_id:
          "0x73bce858a9bc222c38b87b2bdc92fe1424d15b57b61d23ed5e061c025525026f",
        name: "peepin",
        repo: "0xfa6f0ee1ae473c13f0d8c84fa8712fe785e44aa4",
      },
      {
        id: "0xffdeb6370cf1814c193b924309cb341682478f8e6d3d3ea2267a97b5675d40c04f000000",
        RegistryPublic_id:
          "0x5a950cff65e78e41f13ac4b8f70c66f663af5238fa9f0d7ef82a75b2ad48bdd6",
        name: "polkadot-kusama",
        repo: "0x81f40a88afdd522dc1e3ff4e41dd062d00f38ac6",
      },
    ];

    const contract = new DappNodeRegistry(
      `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`,
      "public"
    );

    const result = await contract.queryGraphNewRepos<"public">();
    // registry new repo may change
    expect(result).to.be.ok;
  });
});
