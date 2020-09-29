const { create, decryptMedia } = require('@open-wa/wa-automate')
const fs = require('fs-extra')
const axios = require('axios')
const moment = require('moment')
const get = require('got')
const color = require('./lib/color')
const { liriklagu, quotemaker } = require('./lib/functions')
const quotedd = require('./lib/quote')
const { getZodiak } = require('./src/zodiak');
const { ramalanCinta } = require('./src/ramalan');
const korona = require('./src/korona');
const { uploadImages } = require('./lib/fetcher')


const serverOption = {
    headless: true,
    qrRefreshS: 20,
    qrTimeout: 0,
    authTimeout: 0,
    autoRefresh: true,
    killProcessOnBrowserClose: true,
    cacheEnabled: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // THIS MAY BREAK YOUR APP !!!ONLY FOR TESTING FOR NOW!!!
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}

const opsys = process.platform
if (opsys === 'win32' || opsys === 'win64') {
    serverOption.executablePath = 'C:\\Program Files (X86)\\Google\\Chrome\\Application\\chrome.exe'
} else if (opsys === 'win32' || opsys === 'win64') {
    serverOption.executablePath = 'C:\\Users\\dandisubhani\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
} else if (opsys === 'linux') {
    serverOption.browserRevision = '737027'
} else if (opsys === 'darwin') {
    serverOption.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

const startServer = async () => {
    create('Imperial', serverOption)
        .then((client) => {
            console.log('[SERVER] Server Started!')
            // Force it to keep the current session
            client.onStateChanged((state) => {
                console.log('[Client State]', state)
                if (state === 'CONFLICT') client.forceRefocus()
            })
            // listening on message
            client.onMessage((message) => {
                msgHandler(client, message)
            })

            client.onAddedToGroup((chat) => {
                client.sendText(chat.groupMetadata.id, `Halo Member *${chat.contact.name}* terimakasih sudah menginvite Bot Whatsapp yang gajelas ini,untuk melihat menu silahkan kirim *!help*`)
            })
            // listening on Incoming Call
            client.onIncomingCall((call) => {
                client.sendText(call.peerJid, 'Nelpon? Block !!!\nMau di buka silahkan kontak via Instagram')
                client.contactBlock(call.peerJid)
            })
        })
        .catch((err) => {
            console.error(err)
        })
}

async function msgHandler (client, message) {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, mentionedJidList } = message
        let { body } = message
        const { name } = chat
        let { pushname, verifiedName } = sender
        pushname = pushname || verifiedName // verifiedName is the name of someone who uses a business account
        // if (pushname === undefined) console.log(sender + '\n\n' + chat)
        const prefix = '!'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)
        const time = moment(t * 1000).format('DD/MM HH:mm:ss')
        if (!isCmd && !isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname))
        if (!isCmd && isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
        if (isCmd && !isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        if (isCmd && isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name))

        const botNumber = await client.getHostNumber()
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false
        const isBotGroupAdmins = isGroupMsg ? groupAdmins.includes(botNumber + '@c.us') : false
        const isOwner = sender.id === '6289636035164@c.us'
        const processTime = now => moment.duration(now - moment(t * 1000)).asSeconds() // t => timestamp when message was received

        // Checking function speed
        // const timestamp = moment()
        // const latensi = moment.duration(moment() - timestamp).asSeconds()
        const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
        const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
        switch (command) {
            case 'sticker':
            case 'stiker':
            case 'Sticker':
            case 'Stiker':
            case '#stiker':
            case '#sticker':
            case 'P':
            case 'p':
            case '#STIKER':
            case '#STICKER':
              case 'stimker':
                if (isMedia) {
                    const mediaData = await decryptMedia(message)
                    const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64, message)
                    .then(() => client.reply(from, `Durasi Pembuatan: ${processTime(moment())} *Detik*`))
                    client.reply(from, 'Selesai, Follow https://instagram.com/dandisubhani_ Auto Follback Thanks:)', message.id)
                    client.reply(from, 'Tulis yang ada dipikiranmu tentang bot ini di https://secreto.site/id/16154939 Diisi ya,maacih', message.id)
                } else if (quotedMsg && quotedMsg.type == 'image') {
                    const mediaData = await decryptMedia(quotedMsg)
                    const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64, message)
                     .then(() => client.reply(from, `Durasi Pembuatan: ${processTime(moment())} *Detik*`))
                } else if (args.length >= 1) {
                    const url = args[1]
                    if (url.match(isUrl)) {
                        await client.sendStickerfromUrl(from, url, { method: 'get' })
                            .catch(err => console.log('Caught exception: ', err))
                    } else {
                        client.sendText(from, '_Tidak Valid_')
                    }
                } else {
                    if(isGroupMsg) {
                        client.sendTextWithMentions(from, `Kirim/balas gambar dengan caption *!P*`)
                    } else {
                        client.reply(from, 'Cara Bikin Stiker:\nKirim Gambar Yang Pengen di Jadiin Stiker,Pake Caption *!P*', message)
                    }                        
                }
            break
               case 'korona':
               case 'covid':
      try {
        client.reply(from, 'sedang memuat data...', message.id);
        client.reply(from, await korona());
      } catch (error) {
        client.sendText(from, 'gagal memuat data...', message.id);
        console.log(error.message);
      }
      break;
                case 'zodiak':
      client.reply(from, 'sedang memuat data...', message.id);
      getZodiak(args1, args2)
        .then((result) => {
          client.sendText(from, result);
        })
        .catch((error) => {
          client.reply(from, 'gagal memuat data...', message.id);
          console.log(error.message);
        });
      break;
    case 'love':
      client.reply(from, 'sedang memuat data...', message.id);
      ramalanCinta(args1, args2, args3, args4)
        .then((result) => {
          client.sendText(from, result);
        })
        .catch((error) => {
          client.reply(from, 'gagal memuat data...', message.id);
          console.log(error.message);
        });
      break;
              case 'Halo':
                        client.reply(from, `Halo *${pushname}*, Ada yang bisa saya bantu?`, message)
                    break
                        case 'toxic':
            const toxidd = ['babi', 'monyet', 'anjing', 'dino', 'jembut',
            'memek', 'kontol', 'tempik', 'bool', 'gay', 'lesbi', 'mpshh',
            'sempak', 'cangcut', 'bagong', 'torpedo', 'bangsat', 'maling',
            'copet'
            ]
            const randToxic = toxidd[Math.floor(Math.random() * toxidd.length)]
            const err = [`muka lo kek ${randToxic}`, `anda tau ${randToxic} ?`,`${randToxic} Lo ${randToxic}`,
            `ngapa ${randToxic} ga seneng?`,`ribut sini lo ${randToxic}`,`jangan ngakak lo ${randToxic}`,
            `wey ${randToxic}!!`,`aku sih owh aja ya ${randToxic}`,`ga seneng send lokasi lo ${randToxic}`,
            `capek w ${randToxic}`, `hari ini kau minat gelut ${toxidd[2]} ?`,
            `w ganteng dan lo kek ${randToxic}`,`bucin lo ${randToxic}`,`najis baperan kek ${randToxic}`,
            `nge-teh ${randToxic}`,`gaya lo sok iye, mukalo kek ${randToxic}`,`${randToxic} awokwowkok`
            ]
            const errAcak = err[Math.floor(Math.random() * err.lenght)]
            client.sendText(from, `${errAcak}`)
            break
                case 'hi':
                  const pun = ["https://i.pinimg.com/236x/1e/ac/c6/1eacc606ec8db205d5f6b56a8a14e0a9.jpg","https://i.pinimg.com/236x/cd/51/fd/cd51fd87a17a1f879e9d6a040015a02e.jpg","https://i.pinimg.com/564x/1a/77/d1/1a77d17d317a16a1cf1598e84ff0c507.jpg","https://i.pinimg.com/236x/91/e3/78/91e3786a2822a656f0b9337c23a3b360.jpg","https://i.pinimg.com/564x/b6/2c/4a/b62c4a2f3be0f54a18ea07b95019d964.jpg","https://i.pinimg.com/236x/23/81/47/23814785b0d26e0d14b8c9eaf8302e78.jpg","https://i.pinimg.com/564x/a4/c1/4e/a4c14e7fd8b32ed0f5f290328bb8befd.jpg"]
                  let ten = pun[Math.floor(Math.random() * pun.length)]
            client.sendFileFromUrl(from, ten, 'pun.jpg', `Hai *${pushname}*`, message.id)
            break
        if(isGroupMsg)
        client.sendTextWithMentions(from, `Hi juga @${message.author}`, message.id)
        break
            case 'tts':
            if (args.length == 0) return client.reply(from, 'Kirim perintah *!tts* [id, en, jp, ar] [teks], contoh *!tts* id halo semua')
            const ttsId = require('node-gtts')('id')
            const ttsEn = require('node-gtts')('en')
            const ttsJp = require('node-gtts')('ja')
            const ttsAr = require('node-gtts')('ar')
            const dataText = body.slice(8)
            if (dataText === '') return client.reply(from, 'Baka?', message.id)
            if (dataText.length > 300) return client.reply(from, 'Teks terlalu panjang!', message.id)
            var dataBhs = body.slice(5, 7)
            if (dataBhs == 'id') {
                ttsId.save('./tts/resId.mp3', dataText, function () {
                    client.sendPtt(from, './tts/resId.mp3', message.id)
                })
            } else if (dataBhs == 'en') {
                ttsEn.save('./tts/resEn.mp3', dataText, function () {
                    client.sendPtt(from, './tts/resEn.mp3', message.id)
                })
            } else if (dataBhs == 'jp') {
                ttsJp.save('./tts/resJp.mp3', dataText, function () {
                    client.sendPtt(from, './tts/resJp.mp3', message.id)
                })
            } else if (dataBhs == 'ar') {
                ttsAr.save('./tts/resAr.mp3', dataText, function () {
                    client.sendPtt(from, './tts/resAr.mp3', message.id)
                })
            } else {
                client.reply(from, 'Masukkan data bahasa : [id] untuk indonesia, [en] untuk inggris, [jp] untuk jepang, dan [ar] untuk arab', message.id)
            }
            break
        // kalian bebas edit apapun, tapi saya minta bagian ini jangan di edit:)
        case 'do':
        case 'd':
            client.sendLinkWithAutoPreview(from,'https://saweria.co/donate/dandisubhani','Ya halo om, mau donate?\n\nKalo mau donate nih langsung ae ke:\nOVO : 089636035164\nPulsa : 081296728103\nSaweria : https://saweria.co/donate/dandisubhani')
            break
        case 'tod':
            var orl = body.substring(body.indexOf(' '), body.length)
            if (args.length !== 1) return client.reply(from, 'Untuk menggunakan Perintah ini, kirim perintah *!tod* https://media.giphy.com/blablabla/asw.gif', message.id)
            const reUrl = orl.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
            if(!reUrl) return client.reply(from, 'Untuk saat ini stiker gif hanya bisa menggunakan link giphy saja', message.id)
            await client.sendGiphyAsSticker(from, args[1])
            break
        case 'wait':
            if (isMedia) {
                const fetch = require('node-fetch')
                const toBS4 = require('image-to-base64')
                const mediaData = await decryptMedia(message, uaOverride)
                fs.writeFileSync('./img/nimek.jpg', mediaData, 'base64')
                let res = ''
                kya = toBS4('./img/nimek.jpg')
                .then(
                (res) => {
                fetch('https://trace.moe/api/search', {
                    method: 'POST',
                    body: JSON.stringify({ image: res }),
                    headers: { "Content-Type": "application/json" }
                })
                .then(respon => respon.json())
                .then(resolt => {
                    //console.log(resolt)
                    var teks = `
What Anime Is That?

Echhi ? = *${resolt.docs[0].is_adult}*
Title Jav = *${resolt.docs[0].title}*
Title Romaji = *${resolt.docs[0].title_romaji}*
Title English = *${resolt.docs[0].title_english}*
Total Episode = *${resolt.docs[0].episode}*
Season = *${resolt.docs[0].season}*
`
                    var video = `https://trace.moe/preview.php?anilist_id=${resolt.docs[0].anilist_id}&file=${encodeURIComponent(resolt.docs[0].filename)}&t=${resolt.docs[0].at}&token=${resolt.docs[0].tokenthumb}`;
                    client.sendFileFromUrl(from, video, 'nimek.mp4', teks)
                    }) 
                })
            } else {
                client.sendFile(from, './img/tutod.jpg', 'Tutor.jpg', 'Neh contoh mhank!')
            }
            break
        case 'ytmp3':
            if (args.length >= 1){
                var param = body.substring(body.indexOf(' '), body.length)
                try {
                    client.reply(from, `Tunggu bentar ${pushname}`, message.id)
                    const resp = await get.get('https://yutmp3.herokuapp.com/?url='+ param).json()
                    console.log(resp)
                    if (!resp.file) {
                        client.reply(from, 'Videonya ga valid!', message.id)
                    } else {
                        client.reply(from, `Title : ${resp.title}`, message.id)
                        await client.sendFileFromUrl(from, `https://yutmp3.herokuapp.com${resp.file}`, `${resp.title}.mp3`, message.id)
                    }
                } catch {
                    client.reply(from, `Woi ${pushname} Gagal anjg`, message.id)
                }
            }
            break
        case 'stikergif':
        case 'stickergif':
        case 'gifstiker':
        case 'gifsticker': {
            if (args.length !== 1) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))
            const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
            if (isGiphy) {
                const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                if (!getGiphyCode) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                    client.reply(from, 'Follow https://instagram.com/dandisubhani_ Auto Follback Thanks:)')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                }).catch((err) => console.log(err))
            } else if (isMediaGiphy) {
                const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                if (!gifUrl) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                    client.reply(from, 'Here\'s your sticker')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                }).catch((err) => console.log(err))
            } else {
                await client.reply(from, 'maaf, untuk saat ini sticker gif hanya bisa menggunakan link dari giphy.  [Giphy Only]', id)
            }
            break
        }
        // Video Downloader
        /*case 'tiktok':
            if (args.length !== 1) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            if (!isUrl(url) && !url.includes('tiktok.com')) return client.reply(from, 'Maaf, link yang kamu kirim tidak valid. [Invalid Link]', id)
            await client.reply(from, `_Scraping Metadata..._`, id)
            downloader.tiktok(url).then(async (videoMeta) => {
                const filename = videoMeta.authorMeta.name + '.mp4'
                const caps = `*Metadata:*\nUsername: ${videoMeta.authorMeta.name} \nMusic: ${videoMeta.musicMeta.musicName} \nView: ${videoMeta.playCount.toLocaleString()} \nLike: ${videoMeta.diggCount.toLocaleString()} \nComment: ${videoMeta.commentCount.toLocaleString()} \nShare: ${videoMeta.shareCount.toLocaleString()} \nCaption: ${videoMeta.text.trim() ? videoMeta.text : '-'}`
                await client.sendFileFromUrl(from, videoMeta.url, filename, videoMeta.NoWaterMark ? caps : `⚠ Video tanpa watermark tidak tersedia. \n\n${caps}`, '', { headers: { 'User-Agent': 'okhttp/4.5.0', referer: 'https://www.tiktok.com/' } }, true)
                    .then((serialized) => console.log(`Sukses Mengirim File dengan id: ${serialized} diproses selama ${processTime(t, moment())}`))
                    .catch((err) => console.error(err))
            }).catch(() => client.reply(from, 'Gagal mengambil metadata, link yang kamu kirim tidak valid. [Invalid Link]', id))
            break
        case 'fb':
        case 'facebook':
            if (args.length !== 1) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            if (!isUrl(url) && !url.includes('facebook.com')) return client.reply(from, 'Maaf, url yang kamu kirim tidak valid. [Invalid Link]', id)
            await client.reply(from, '_Scraping Metadata..._', id)
            downloader.facebook(url).then(async (videoMeta) => {
                const title = videoMeta.response.title
                const thumbnail = videoMeta.response.thumbnail
                const links = videoMeta.response.links
                const shorts = []
                for (let i = 0; i < links.length; i++) {
                    const shortener = await urlShortener(links[i].url)
                    console.log('Shortlink: ' + shortener)
                    links[i].short = shortener
                    shorts.push(links[i])
                }
                const link = shorts.map((x) => `${x.resolution} Quality: ${x.short}`)
                const caption = `Text: ${title} \n\nLink Download: \n${link.join('\n')} \n\nProcessed for ${processTime(t, moment())} _Second_`
                await client.sendFileFromUrl(from, thumbnail, 'videos.jpg', caption, null, null, true)
                    .then((serialized) => console.log(`Sukses Mengirim File dengan id: ${serialized} diproses selama ${processTime(t, moment())}`))
                    .catch((err) => console.error(err))
            })
                .catch((err) => client.reply(from, `Error, url tidak valid atau tidak memuat video. [Invalid Link or No Video] \n\n${err}`, id))
            break*/
      case 'ig':
            if (args.length >= 1) {
                var param = body.substring(body.indexOf(' '), body.length)
                try {
                    client.reply(from, 'Permintaan sedang diproses ...', message.id)
                    const resp = await get.get('https://villahollanda.com/api.php?url='+ param).json()
                    console.log(resp)
                    if (resp.mediatype == 'photo') {
                        var ext = '.png'
                    }else{
                        var ext = '.mp4'
                    }
                        client.sendFileFromUrl(from, resp.descriptionc, `igeh${ext}`, 'Instagram Downloader by • Bot Ganteng', message.id)
                } catch {
                    client.reply(from, 'Gagal Coy')
                    }
                }
            break
             case 'botstat': 
            const loadedMsg = await client.getAmountOfLoadedMessages()
            const chatIds = await client.getAllChatIds()
            const groups = await client.getAllGroups()
            client.sendText(from, `Status :\n- *${loadedMsg}* Pesan Masuk\n- *${groups.length}* Jumlah Grup\n- *${chatIds.length - groups.length}* Chat Pribadi\n- *${chatIds.length}* Total Chat`)
            break
        /*case 'doujinshi':
            if (args.length >= 1) {
                const nuklir = body.split(' ')[1]
                const nanap = require('nana-api')
                const nana = new nanap()
                const { exec } = require ('child_process')
                client.sendText(from,'Tunnggu yak')
                nana.g(nuklir).then((g => {
                    if (g == 'Book not found'){
                         client.reply(from, 'Kode nuklir salah um', message.id)
                    } else {
                        var url = "https://t.nhentai.net/galleries/"+ g.media_id +"/cover.jpg"
                        try {
                            var teks = "Judul English  : "+ g.title.english.slice("0") +" \n \n Judul Japanese : "+ g.title.japanese +"\n \n Judul Pendek   : "+ g.title.pretty +"\n \n Kode Nuklir    : "+ g.id;
                            exec('nhentai --id=' + g.id + ` -P mantap.pdf -o ./hentong/${g.id}.pdf --format `+ `${g.id}.pdf`, (error, stdout, stderr) => {
                                client.sendFileFromUrl(from, url, 'hentod.jpg', teks)
                                client.sendFile(from, `./hentong/${g.id}.pdf/${g.id}.pdf.pdf`, `${g.title.pretty}.pdf`)
                            if (error) {
                                console.log('error : '+ error.message)
                                return
                            }
                            if (stderr) {
                                console.log('stderr : '+ stderr)
                                return
                            }
                            console.log('stdout : '+ stdout)
                                })
                        } catch {
                            client.reply(from, 'Terjadi kesalahan, mungkin kode nuklir salah', message.id)
                        }
                        }
                    }))
                }	
                break*/
            case 'brainly':
            if(args.length >= 1){
                function BrainlySearch(pertanyaan, amount,cb){
                    brainly(pertanyaan.toString(),Number(amount)).then(res => {	
                        let brainlyResult=[];	
                    res.forEach(ask=>{
                        let opt={
                            pertanyaan:ask.pertanyaan,
                            fotoPertanyaan:ask.questionMedia,
                        }
                        ask.jawaban.forEach(answer=>{
                            opt.jawaban={
                                judulJawaban:answer.text,
                                fotoJawaban:answer.media
                            }
                        })
                        brainlyResult.push(opt)
                        })	
                        return brainlyResult	
                    }).then(x=>{
                        cb(x)	
                    }).catch(err=>{
                        console.log(`${err}`.error)
                    })
                    }
                    const brainly = require('brainly-scraper')
                    let tanya = body.slice(9)
                    console.log(tanya.length-1)
                    let jum = Number(tanya.split('.')[1]) || 2
                    if(Number(tanya[tanya.length-1])){
                        tanya
                    }
                    let quest = body.slice(9)
                    client.reply(from, `*Pertanyaan : ${quest.split(' .')[0]}*\n*Jumlah jawaban : ${Number(jum)}*`, message.id)
                    BrainlySearch(quest.split(' .')[0],Number(jum), function(res){
                        console.log(res)
                        res.forEach(x=>{
                            client.reply(from, `*foto pertanyaan*\n${x.fotoPertanyaan.join('\n')}\n*pertanyaan :*\n${x.pertanyaan}\n\n*jawaban :*\n${x.jawaban.judulJawaban}\n\n*foto jawaban*\n${x.jawaban.fotoJawaban.join('\n')}`, message.id)
                        })
                    })
            } else {
                client.reply(from, 'Usage :\n!brainly <pertanyaan> <.jumlah>\n\nEx : \n!brainly NKRI .2', message.id)
            }
            break
               case 'bc':
            if(!isOwner) return client.reply(from, 'Perintah ini hanya untuk Owner bot!', message.id)
            let msg = body.slice(4)
            const chatz = await client.getAllChatIds()
            for (let ids of chatz) {
                var cvk = await client.getChatById(ids)
                if (!cvk.isReadOnly) client.sendText(ids, `[ NOTIFIKASI BOT ]\n${msg}`)
            }
            client.reply(from, 'Broadcast Success!', message.id)
            break
        case 'ban':
           if(!isOwner) return client.reply(from, 'Perintah ini hanya untuk Owner bot!', message.id)
                client.reply(from, 'Succes ban anjing!', message.id)
            break
        /*case 'mentionall':
        case 'absen':
        case 'tagall':
        case 'apakah':
        case 'punten':
        case '!anjay':
            if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', message.id)
            if (!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', message.id)
            const groupMem = await client.getGroupMembers(groupId)
            let hehe = `╔══✪〘 Absen ${chat.contact.name} 〙✪══\n`
            let totalMem = chat.groupMetadata.participants.lengthsss
            for (let i = 0; i < groupMem.length; i++) {
                hehe += '╠➥'
                hehe += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehe += `╚═〘 Mention All by Bot 〙`
            await client.sendTextWithMentions(from, hehe)
            break*/
        case 'kickall':
            const isGroupOwner = sender.id === chat.groupMetadata.owner
            if(!isGroupOwner) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh Owner group', message.id)
            if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            const allMem = await client.getGroupMembers(groupId)
            console.log(isGroupAdmins)
            for (let i = 0; i < allMem.length; i++) {
                if (groupAdmins.includes(allMem[i].id)) return
                await client.removeParticipant(groupId, allMem[i].id)
            }
            client.reply(from, 'Succes kick all member', message.id)
            break
        case 'leaveall':
            if (!isOwner) return client.reply(from, 'Perintah ini hanya untuk Owner bot', message.id)
            const allChats = await client.getAllChatIds()
            const allGroups = await client.getAllGroups()
            for (let gclist of allGroups) {
                await client.sendText(gclist.contact.id, `Maaf bot sedang pembersihan, total chat aktif : ${allChats.length}`)
                await client.leaveGroup(gclist.contact.id)
            }
            client.reply(from, 'Succes leave all group!', message.id)
            break
        case 'clearall':
            if (!isOwner) return client.reply(from, 'Perintah ini hanya untuk Owner bot', message.id)
            const allChatz = await client.getAllChats()
            for (let dchat of allChatz) {
                await client.deleteChat(dchat.id)
            }
            client.reply(from, 'Succes clear all chat!', message.id)
            break
        case 'unban':
            if(!isOwner) return client.reply(from, 'Perintah *!unban* hanya untuk Owner bot!', message.id)
            client.reply(from, 'Succes unban babi!', message.id)
            break
        case 'quotemaker':
        case 'qmaker': "value", 
            arg = body.trim().split('|')
            if (arg.length >= 3) {
                client.sendText(from, 'Quotes sedang dibuat ...', message.id) 
                const quotes = arg[1]
                const author = arg[2]
                const theme = arg[3]
                const resolt = await quotemaker(quotes, author, theme)
                await client.reply('Quotes sedang dikirim ...', message.id )
                client.sendFile(from, resolt, 'quotesmaker.jpg',`Quotes by ${pushname}`)
            } else {
                client.reply(from, 'Tutor: \n!qmaker |teks|watermark|\n\nEx :\n!qmaker |dandiganteng|dandisubhani|', message.id)
            }
            break
          /*case 'link':
            if(!isBotGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            if(isGroupMsg) {
                const inviteLink = await client.getGroupInviteLink(groupId);
                client.sendLinkWithAutoPreview(from, inviteLink, `\nLink Grup *${name}*`, message.id)
            } else {
                client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', message.id)
            }
            break*/
        case 'add':
            if(!isGroupMsg) return client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            if(args.length !== 1) return client.reply(from, 'Untuk menggunakan fitur ini, kirim perintah *!add* 628xxxxx', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            try {
                await client.addParticipant(from,`${args[1]}@c.us`)
            } catch {
                client.reply(from, `Tidak dapat menambahkan ${args[1]} mungkin karena di private`, message.id)
            }
            break
              case 'edotensei':
            if(!isGroupMsg) return client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            if(mentionedJidList.length === 0) return client.reply(from, 'Untuk menggunakan Perintah ini, kirim perintah *!kick* @tagmember', message.id)
            await client.sendText(from, `Perintah diterima, mengeluarkan:\n${mentionedJidList.join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                    await client.removeParticipant(groupId, mentionedJidList[i])
                    .then(() => client.addParticipant(from,`${args[1]}@c.us`))
                   } break
        case 'kick':
            if(!isGroupMsg) return client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            if(mentionedJidList.length === 0) return client.reply(from, 'Untuk menggunakan Perintah ini, kirim perintah *!kick* @tagmember', message.id)
            await client.sendText(from, `Perintah diterima, mengeluarkan:\n${mentionedJidList.join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                try {
                    if (groupAdmins.includes(mentionedJidList[i])) return await client.sendText('Gagal, kamu tidak bisa mengeluarkan admin grup.')
                    await client.removeParticipant(groupId, mentionedJidList[i])
                } catch {
                    client.sendText('Gagal, kamu tidak bisa mengeluarkan admin grup.')
                }
            }
            break
        case 'leave':
            if(!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin group', message.id)
            client.sendText(from,'Sayonara')
            client.leaveGroup(groupId)
            break
        case 'promote':
        case 'pm':
            if(!isGroupMsg) return client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Fitur ini hanya bisa di gunakan oleh admin group', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Fitur ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            if (mentionedJidList.length === 0) return await client.reply(from, 'Untuk menggunakan fitur ini, kirim perintah *!promote* @tagmember', message.id)
            if (mentionedJidList.length >= 2) return await client.reply(from, 'Maaf, perintah ini hanya dapat digunakan kepada 1 user.', message.id)
            if (groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut sudah menjadi admin.', message.id)
            await client.promoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Perintah diterima, menambahkan @${mentionedJidList[0].replace('@c.us', '')} sebagai admin.`)
            break
        case 'demote':
        case 'nopm':
            if(!isGroupMsg) return client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            if(!isGroupAdmins) return client.reply(from, 'Fitur ini hanya bisa di gunakan oleh admin group', message.id)
            if(!isBotGroupAdmins) return client.reply(from, 'Fitur ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Untuk menggunakan fitur ini, kirim perintah *!demote* @tagadmin', message.id)
            if (mentionedJidList.length >= 2) return await client.reply(from, 'Maaf, perintah ini hanya dapat digunakan kepada 1 orang.', message.id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut tidak menjadi admin.', message.id)
            await client.demoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Perintah diterima, menghapus jabatan @${mentionedJidList[0].replace('@c.us', '')}.`)
            break
        case 'revLinkGrup':
        case 'tariklink':
            if(isGroupMsg && isBotGroupAdmins && isGroupAdmins) {
                await client.revokeGroupInviteLink(groupId)
            } else if(!isGroupMsg) {
                client.reply(from, 'Fitur ini hanya bisa di gunakan dalam group', message.id)
            } else if(!isGroupAdmins) {
                client.reply(from, 'Fitur ini hanya bisa di gunakan oleh admin group', message.id)
            } else if(!isBotGroupAdmins) {
                client.reply(from, 'Fitur ini hanya bisa di gunakan ketika bot menjadi admin', message.id)
            }
            break
        case 'lirik':
            if (args.length == 0) return client.reply(from, 'Kirim perintah *!lirik* judul lagu, contoh *!lirik* aku bukan boneka', message.id)
            const lagu = body.slice(7)
            console.log(lagu)
            const lirik = await liriklagu(lagu)
            client.sendText(from, lirik)
            break
        //case 'cerpen':
        //    client.reply(from, cerpen(), message.id)
        //    break
        /*case 'waifu': 
            const data = fs.readFileSync('./lib/waifu.json')
            const dataJson = JSON.parse(data)
            const randIndex = Math.floor(Math.random() * dataJson.length)
            const randKey = dataJson[randIndex]
            client.sendFileFromUrl(from, randKey.image, 'Waifu.jpg', randKey.teks)
            break*/
        case 'inu':
        case 'anjing':
            const list = ["https://cdn.shibe.online/shibes/247d0ac978c9de9d9b66d72dbdc65f2dac64781d.jpg","https://cdn.shibe.online/shibes/1cf322acb7d74308995b04ea5eae7b520e0eae76.jpg","https://cdn.shibe.online/shibes/1ce955c3e49ae437dab68c09cf45297d68773adf.jpg","https://cdn.shibe.online/shibes/ec02bee661a797518d37098ab9ad0c02da0b05c3.jpg","https://cdn.shibe.online/shibes/1e6102253b51fbc116b887e3d3cde7b5c5083542.jpg","https://cdn.shibe.online/shibes/f0c07a7205d95577861eee382b4c8899ac620351.jpg","https://cdn.shibe.online/shibes/3eaf3b7427e2d375f09fc883f94fa8a6d4178a0a.jpg","https://cdn.shibe.online/shibes/c8b9fcfde23aee8d179c4c6f34d34fa41dfaffbf.jpg","https://cdn.shibe.online/shibes/55f298bc16017ed0aeae952031f0972b31c959cb.jpg","https://cdn.shibe.online/shibes/2d5dfe2b0170d5de6c8bc8a24b8ad72449fbf6f6.jpg","https://cdn.shibe.online/shibes/e9437de45e7cddd7d6c13299255e06f0f1d40918.jpg","https://cdn.shibe.online/shibes/6c32141a0d5d089971d99e51fd74207ff10751e7.jpg","https://cdn.shibe.online/shibes/028056c9f23ff40bc749a95cc7da7a4bb734e908.jpg","https://cdn.shibe.online/shibes/4fb0c8b74dbc7653e75ec1da597f0e7ac95fe788.jpg","https://cdn.shibe.online/shibes/125563d2ab4e520aaf27214483e765db9147dcb3.jpg","https://cdn.shibe.online/shibes/ea5258fad62cebe1fedcd8ec95776d6a9447698c.jpg","https://cdn.shibe.online/shibes/5ef2c83c2917e2f944910cb4a9a9b441d135f875.jpg","https://cdn.shibe.online/shibes/6d124364f02944300ae4f927b181733390edf64e.jpg","https://cdn.shibe.online/shibes/92213f0c406787acd4be252edb5e27c7e4f7a430.jpg","https://cdn.shibe.online/shibes/40fda0fd3d329be0d92dd7e436faa80db13c5017.jpg","https://cdn.shibe.online/shibes/e5c085fc427528fee7d4c3935ff4cd79af834a82.jpg","https://cdn.shibe.online/shibes/f83fa32c0da893163321b5cccab024172ddbade1.jpg","https://cdn.shibe.online/shibes/4aa2459b7f411919bf8df1991fa114e47b802957.jpg","https://cdn.shibe.online/shibes/2ef54e174f13e6aa21bb8be3c7aec2fdac6a442f.jpg","https://cdn.shibe.online/shibes/fa97547e670f23440608f333f8ec382a75ba5d94.jpg","https://cdn.shibe.online/shibes/fb1b7150ed8eb4ffa3b0e61ba47546dd6ee7d0dc.jpg","https://cdn.shibe.online/shibes/abf9fb41d914140a75d8bf8e05e4049e0a966c68.jpg","https://cdn.shibe.online/shibes/f63e3abe54c71cc0d0c567ebe8bce198589ae145.jpg","https://cdn.shibe.online/shibes/4c27b7b2395a5d051b00691cc4195ef286abf9e1.jpg","https://cdn.shibe.online/shibes/00df02e302eac0676bb03f41f4adf2b32418bac8.jpg","https://cdn.shibe.online/shibes/4deaac9baec39e8a93889a84257338ebb89eca50.jpg","https://cdn.shibe.online/shibes/199f8513d34901b0b20a33758e6ee2d768634ebb.jpg","https://cdn.shibe.online/shibes/f3efbf7a77e5797a72997869e8e2eaa9efcdceb5.jpg","https://cdn.shibe.online/shibes/39a20ccc9cdc17ea27f08643b019734453016e68.jpg","https://cdn.shibe.online/shibes/e67dea458b62cf3daa4b1e2b53a25405760af478.jpg","https://cdn.shibe.online/shibes/0a892f6554c18c8bcdab4ef7adec1387c76c6812.jpg","https://cdn.shibe.online/shibes/1b479987674c9b503f32e96e3a6aeca350a07ade.jpg","https://cdn.shibe.online/shibes/0c80fc00d82e09d593669d7cce9e273024ba7db9.jpg","https://cdn.shibe.online/shibes/bbc066183e87457b3143f71121fc9eebc40bf054.jpg","https://cdn.shibe.online/shibes/0932bf77f115057c7308ef70c3de1de7f8e7c646.jpg","https://cdn.shibe.online/shibes/9c87e6bb0f3dc938ce4c453eee176f24636440e0.jpg","https://cdn.shibe.online/shibes/0af1bcb0b13edf5e9b773e34e54dfceec8fa5849.jpg","https://cdn.shibe.online/shibes/32cf3f6eac4673d2e00f7360753c3f48ed53c650.jpg","https://cdn.shibe.online/shibes/af94d8eeb0f06a0fa06f090f404e3bbe86967949.jpg","https://cdn.shibe.online/shibes/4b55e826553b173c04c6f17aca8b0d2042d309fb.jpg","https://cdn.shibe.online/shibes/a0e53593393b6c724956f9abe0abb112f7506b7b.jpg","https://cdn.shibe.online/shibes/7eba25846f69b01ec04de1cae9fed4b45c203e87.jpg","https://cdn.shibe.online/shibes/fec6620d74bcb17b210e2cedca72547a332030d0.jpg","https://cdn.shibe.online/shibes/26cf6be03456a2609963d8fcf52cc3746fcb222c.jpg","https://cdn.shibe.online/shibes/c41b5da03ad74b08b7919afc6caf2dd345b3e591.jpg","https://cdn.shibe.online/shibes/7a9997f817ccdabac11d1f51fac563242658d654.jpg","https://cdn.shibe.online/shibes/7221241bad7da783c3c4d84cfedbeb21b9e4deea.jpg","https://cdn.shibe.online/shibes/283829584e6425421059c57d001c91b9dc86f33b.jpg","https://cdn.shibe.online/shibes/5145c9d3c3603c9e626585cce8cffdfcac081b31.jpg","https://cdn.shibe.online/shibes/b359c891e39994af83cf45738b28e499cb8ffe74.jpg","https://cdn.shibe.online/shibes/0b77f74a5d9afaa4b5094b28a6f3ee60efcb3874.jpg","https://cdn.shibe.online/shibes/adccfdf7d4d3332186c62ed8eb254a49b889c6f9.jpg","https://cdn.shibe.online/shibes/3aac69180f777512d5dabd33b09f531b7a845331.jpg","https://cdn.shibe.online/shibes/1d25e4f592db83039585fa480676687861498db8.jpg","https://cdn.shibe.online/shibes/d8349a2436420cf5a89a0010e91bf8dfbdd9d1cc.jpg","https://cdn.shibe.online/shibes/eb465ef1906dccd215e7a243b146c19e1af66c67.jpg","https://cdn.shibe.online/shibes/3d14e3c32863195869e7a8ba22229f457780008b.jpg","https://cdn.shibe.online/shibes/79cedc1a08302056f9819f39dcdf8eb4209551a3.jpg","https://cdn.shibe.online/shibes/4440aa827f88c04baa9c946f72fc688a34173581.jpg","https://cdn.shibe.online/shibes/94ea4a2d4b9cb852e9c1ff599f6a4acfa41a0c55.jpg","https://cdn.shibe.online/shibes/f4478196e441aef0ada61bbebe96ac9a573b2e5d.jpg","https://cdn.shibe.online/shibes/96d4db7c073526a35c626fc7518800586fd4ce67.jpg","https://cdn.shibe.online/shibes/196f3ed10ee98557328c7b5db98ac4a539224927.jpg","https://cdn.shibe.online/shibes/d12b07349029ca015d555849bcbd564d8b69fdbf.jpg","https://cdn.shibe.online/shibes/80fba84353000476400a9849da045611a590c79f.jpg","https://cdn.shibe.online/shibes/94cb90933e179375608c5c58b3d8658ef136ad3c.jpg","https://cdn.shibe.online/shibes/8447e67b5d622ef0593485316b0c87940a0ef435.jpg","https://cdn.shibe.online/shibes/c39a1d83ad44d2427fc8090298c1062d1d849f7e.jpg","https://cdn.shibe.online/shibes/6f38b9b5b8dbf187f6e3313d6e7583ec3b942472.jpg","https://cdn.shibe.online/shibes/81a2cbb9a91c6b1d55dcc702cd3f9cfd9a111cae.jpg","https://cdn.shibe.online/shibes/f1f6ed56c814bd939645138b8e195ff392dfd799.jpg","https://cdn.shibe.online/shibes/204a4c43cfad1cdc1b76cccb4b9a6dcb4a5246d8.jpg","https://cdn.shibe.online/shibes/9f34919b6154a88afc7d001c9d5f79b2e465806f.jpg","https://cdn.shibe.online/shibes/6f556a64a4885186331747c432c4ef4820620d14.jpg","https://cdn.shibe.online/shibes/bbd18ae7aaf976f745bc3dff46b49641313c26a9.jpg","https://cdn.shibe.online/shibes/6a2b286a28183267fca2200d7c677eba73b1217d.jpg","https://cdn.shibe.online/shibes/06767701966ed64fa7eff2d8d9e018e9f10487ee.jpg","https://cdn.shibe.online/shibes/7aafa4880b15b8f75d916b31485458b4a8d96815.jpg","https://cdn.shibe.online/shibes/b501169755bcf5c1eca874ab116a2802b6e51a2e.jpg","https://cdn.shibe.online/shibes/a8989bad101f35cf94213f17968c33c3031c16fc.jpg","https://cdn.shibe.online/shibes/f5d78feb3baa0835056f15ff9ced8e3c32bb07e8.jpg","https://cdn.shibe.online/shibes/75db0c76e86fbcf81d3946104c619a7950e62783.jpg","https://cdn.shibe.online/shibes/8ac387d1b252595bbd0723a1995f17405386b794.jpg","https://cdn.shibe.online/shibes/4379491ef4662faa178f791cc592b52653fb24b3.jpg","https://cdn.shibe.online/shibes/4caeee5f80add8c3db9990663a356e4eec12fc0a.jpg","https://cdn.shibe.online/shibes/99ef30ea8bb6064129da36e5673649e957cc76c0.jpg","https://cdn.shibe.online/shibes/aeac6a5b0a07a00fba0ba953af27734d2361fc10.jpg","https://cdn.shibe.online/shibes/9a217cfa377cc50dd8465d251731be05559b2142.jpg","https://cdn.shibe.online/shibes/65f6047d8e1d247af353532db018b08a928fd62a.jpg","https://cdn.shibe.online/shibes/fcead395cbf330b02978f9463ac125074ac87ab4.jpg","https://cdn.shibe.online/shibes/79451dc808a3a73f99c339f485c2bde833380af0.jpg","https://cdn.shibe.online/shibes/bedf90869797983017f764165a5d97a630b7054b.jpg","https://cdn.shibe.online/shibes/dd20e5801badd797513729a3645c502ae4629247.jpg","https://cdn.shibe.online/shibes/88361ee50b544cb1623cb259bcf07b9850183e65.jpg","https://cdn.shibe.online/shibes/0ebcfd98e8aa61c048968cb37f66a2b5d9d54d4b.jpg"]
            let kya = list[Math.floor(Math.random() * list.length)]
            client.sendFileFromUrl(from, kya, 'Dog.jpeg', 'Anjing:v', message.id)
            break
            case 'agung':
            case 'agil':
            case 'andi':
            case 'rozie':
            case 'babi':
            const babi = ["https://pbs.twimg.com/profile_images/2575672885/pyqx4pwyhh4g4zy0hazi_400x400.jpeg","https://img.idxchannel.com/media/1000/images/idx/2019/10/16/pig.jpg","data:image/jpeg;base64,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","https://media.suara.com/pictures/970x544/2019/09/13/98190-babi-shutterstock.jpg","https://static.sederet.com/images/2019/04/pigs_1554440132-300x296.jpg","https://www.abangbrian.com/2018/wp-content/uploads/2017/11/babi-dlm-vaksin.jpg","https://i.pinimg.com/originals/a0/f6/14/a0f6141429554938f024971579de3af2.jpg"]
            let pip = babi[Math.floor(Math.random() * babi.length)]
            client.sendFileFromUrl(from, pip, 'Babi.jpg', ':v', message.id)
            break
            case 'pptl':
            const pptl = ["https://i.pinimg.com/564x/b2/84/55/b2845599d303a4f8fc4f7d2a576799fa.jpg","https://i.pinimg.com/236x/98/08/1c/98081c4dffde1c89c444db4dc1912d2d.jpg","https://i.pinimg.com/236x/a7/e2/fe/a7e2fee8b0abef9d9ecc8885557a4e91.jpg","https://i.pinimg.com/236x/ee/ae/76/eeae769648dfaa18cac66f1d0be8c160.jpg","https://i.pinimg.com/236x/b2/84/55/b2845599d303a4f8fc4f7d2a576799fa.jpg","https://i.pinimg.com/564x/78/7c/49/787c4924083a9424a900e8f1f4fdf05f.jpg","https://i.pinimg.com/236x/eb/05/dc/eb05dc1c306f69dd43b7cae7cbe03d27.jpg","https://i.pinimg.com/236x/d0/1b/40/d01b40691c68b84489f938b939a13871.jpg","https://i.pinimg.com/236x/31/f3/06/31f3065fa218856d7650e84b000d98ab.jpg","https://i.pinimg.com/236x/4a/e5/06/4ae5061a5c594d3fdf193544697ba081.jpg","https://i.pinimg.com/236x/56/45/dc/5645dc4a4a60ac5b2320ce63c8233d6a.jpg","https://i.pinimg.com/236x/7f/ad/82/7fad82eec0fa64a41728c9868a608e73.jpg","https://i.pinimg.com/236x/ce/f8/aa/cef8aa0c963170540a96406b6e54991c.jpg","https://i.pinimg.com/236x/77/02/34/77023447b040aef001b971e0defc73e3.jpg","https://i.pinimg.com/236x/4a/5c/38/4a5c38d39687f76004a097011ae44c7d.jpg","https://i.pinimg.com/236x/41/72/af/4172af2053e54ec6de5e221e884ab91b.jpg","https://i.pinimg.com/236x/26/63/ef/2663ef4d4ecfc935a6a2b51364f80c2b.jpg","https://i.pinimg.com/236x/2b/cb/48/2bcb487b6d398e8030814c7a6c5a641d.jpg","https://i.pinimg.com/236x/62/da/23/62da234d941080696428e6d4deec6d73.jpg","https://i.pinimg.com/236x/d4/f3/40/d4f340e614cc4f69bf9a31036e3d03c5.jpg","https://i.pinimg.com/236x/d4/97/dd/d497dd29ca202be46111f1d9e62ffa65.jpg","https://i.pinimg.com/564x/52/35/66/523566d43058e26bf23150ac064cfdaa.jpg","https://i.pinimg.com/236x/36/e5/27/36e52782f8d10e4f97ec4dbbc97b7e67.jpg","https://i.pinimg.com/236x/02/a0/33/02a033625cb51e0c878e6df2d8d00643.jpg","https://i.pinimg.com/236x/30/9b/04/309b04d4a498addc6e4dd9d9cdfa57a9.jpg","https://i.pinimg.com/236x/9e/1d/ef/9e1def3b7ce4084b7c64693f15b8bea9.jpg","https://i.pinimg.com/236x/e1/8f/a2/e18fa21af74c28e439f1eb4c60e5858a.jpg","https://i.pinimg.com/236x/22/d9/22/22d9220de8619001fe1b27a2211d477e.jpg","https://i.pinimg.com/236x/af/ac/4d/afac4d11679184f557d9294c2270552d.jpg","https://i.pinimg.com/564x/52/be/c9/52bec924b5bdc0d761cfb1160865b5a1.jpg","https://i.pinimg.com/236x/1a/5a/3c/1a5a3cffd0d936cd4969028668530a15.jpg"]
            let pep = pptl[Math.floor(Math.random() * pptl.length)]
            client.sendFileFromUrl(from, pep, 'pptl.jpg', 'Penyegar Timeline Pinterest', message.id)
            break
        case 'neko':    
        case 'kucing':      
            q2 = Math.floor(Math.random() * 900) + 300;
            q3 = Math.floor(Math.random() * 900) + 300;
            client.sendFileFromUrl(from, 'http://placekitten.com/'+q3+'/'+q2, 'neko.png','Kucing ', message.id)
            break
        case 'pokemon':
            q7 = Math.floor(Math.random() * 890) + 1;
            client.sendFileFromUrl(from, 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/'+q7+'.png','Pokemon.png',)
            break
        case 'wallpaper' :
          const wp = ["https://i.pinimg.com/236x/60/5f/bb/605fbbcded6d2f0908f219bf91026717.jpg","https://i.pinimg.com/564x/a0/21/d3/a021d3e4e5f4f40692b50c4e2d07c5e6.jpg","https://i.pinimg.com/236x/67/31/b3/6731b3bbbb6ef4114dc232698cfbd55c.jpg","https://i.pinimg.com/236x/8c/4f/56/8c4f5680ff3bd9a5f500388507b78f31.jpg","https://i.pinimg.com/236x/2a/4c/09/2a4c09a1377019cc1b05298d9b3a9d39.jpg","https://i.pinimg.com/236x/d5/14/f9/d514f998823cf23621b55d616010af6d.jpg","https://i.pinimg.com/236x/01/58/d5/0158d53314218f9d3979aaa6155c6cb5.jpg","https://i.pinimg.com/236x/0f/9d/df/0f9ddf0cb959b303a6a58bb40b2afb77.jpg","https://i.pinimg.com/236x/d9/37/20/d9372030a98fc2570df828cbb2b5db66.jpg","https://i.pinimg.com/236x/ea/2b/59/ea2b593714d275a076176d18b54a2b7a.jpg","https://i.pinimg.com/236x/28/78/ca/2878ca4bcea7b8d85031be044702b7b6.jpg","https://i.pinimg.com/236x/e2/d0/5a/e2d05a012da0bce9d49fb8efa9032997.jpg","https://i.pinimg.com/236x/c1/87/5c/c1875c4262c0e3c79c916e52336eef74.jpg","https://i.pinimg.com/236x/90/76/d2/9076d2939caf6664b7999ad4df1e8c7b.jpg","https://i.pinimg.com/236x/da/27/9e/da279e14e23447d91c60f893b30f2efe.jpg","https://i.pinimg.com/236x/7b/39/35/7b3935bcb0e21832e64c68a30838a166.jpg","https://i.pinimg.com/236x/6f/2b/e7/6f2be7f0c431965935e3ab4a11da655c.jpg","https://i.pinimg.com/236x/cc/bc/48/ccbc48b8ca0683cee844a1e0937c44f4.jpg","https://i.pinimg.com/236x/25/51/ba/2551ba15b8a463e01a1c559d43ab9c34.jpg","https://i.pinimg.com/236x/38/b5/05/38b5055dc772bc14c2c3d440845419af.jpg","https://i.pinimg.com/236x/e7/ff/ef/e7ffef8a8735f86dba1e088de197b8ec.jpg","https://i.pinimg.com/originals/39/09/f2/3909f289a451bd85efd993852fe0a02b.jpg","https://i.pinimg.com/236x/d6/42/1a/d6421a4b46e104fd4ef9a0a63efac79e.jpg","https://i.pinimg.com/236x/a7/9e/3a/a79e3aa1684a3770d7ade5e5b42f707d.jpg","https://i.pinimg.com/236x/39/dc/75/39dc75bf8e313ad1b0cf6a579d0547ab.jpg","https://i.pinimg.com/236x/e2/3b/b5/e23bb594670f9c5ac0dfabbb071354f8.jpg","https://i.pinimg.com/236x/98/1d/34/981d34c4fb2e593d684c8b31d6b63887.jpg","https://i.pinimg.com/236x/3d/a1/6d/3da16d7d6da41f5b3e14dd12d6911ece.jpg","https://i.pinimg.com/236x/db/d0/c6/dbd0c6eb2f6d3e280e07ce734c45b8b5.jpg","https://i.pinimg.com/236x/56/a2/9f/56a29f775481d0e973de89d364bb205f.jpg","https://i.pinimg.com/564x/1a/a1/e1/1aa1e122a950b624647adf5c555b9c61.jpg","https://i.pinimg.com/564x/90/d0/d1/90d0d1cf0d9e190e0a9d64c1059c0516.jpg","https://i.pinimg.com/564x/73/99/99/739999ac684e1bf3cdcf9748d8705cfc.jpg","https://i.pinimg.com/236x/e0/c4/49/e0c44919aab96d0091a850c62fb8620a.jpg"]
            let wpp = wp[Math.floor(Math.random() * wp.length)]
             client.sendFileFromUrl(from, wpp, 'wp.jpg', 'Random Wallpaper Pinterest', message.id)
            break
              /*case 'slap':
              case 'tampar'
            arg = body.trim().split(' ')
            const person = author.replace('@c.us', '')
            await client.sendGiphyAsSticker(from, 'https://media.giphy.com/media/S8507sBJm1598XnsgD/source.gif')
            client.sendTextWithMentions(from, '@' + person + ' *menampar* ' + arg[1])
            break*/
             case 'ping':
             case 'absen':
            if (!isGroupMsg) return client.reply(from, 'Sorry, This command can only be used in groups', message.id)
            if (!isGroupAdmins) return client.reply(from, 'Well, only admins can use this command', message.id)
            const groupMem = await client.getGroupMembers(groupId)
            let hehe = `${body.slice(6)} dari ${pushname} \n`
            for (let i = 0; i < groupMem.length; i++) {
                hehe += '•'
                hehe += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehe += 'Jumlah Member : Mana Saya Tau Saya Kan Bot'
            await client.sendTextWithMentions(from, hehe)
            break
        case 'quote' :
        case 'quotes' :
          case 'Quotes':
            client.reply(from, quotedd())
            break
        case 'meme':
            if ((isMedia || isQuotedImage) && args.length >= 2) {
                const top = arg.split('|')[0]
                const bottom = arg.split('|')[1]
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const getUrl = await uploadImages(mediaData, false)
                const ImageBase64 = await meme.custom(getUrl, top, bottom)
                client.sendFile(from, ImageBase64, 'image.png', '', null, true)
                    .then((serialized) => console.log(`Sukses Mengirim File dengan id: ${serialized} diproses selama ${processTime(t, moment())}`))
                    .catch((err) => console.error(err))
            } else {
                await client.reply(from, 'Tidak ada gambar! Untuk membuka cara penggnaan kirim !menu [Wrong Format]', id)
            }
            break
        /*case 'translate':
            if (args.length != 1) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            if (!quotedMsg) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
            translate(quoteText, args[0])
                .then((result) => client.sendText(from, result))
                .catch(() => client.sendText(from, 'Error, Kode bahasa salah.'))
            break
        case 'ceklokasi':
        case 'ceklok':
            if (quotedMsg.type !== 'location') return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu. [Wrong Format]', id)
            console.log(`Request Status Zona Penyebaran Covid-19 (${quotedMsg.lat}, ${quotedMsg.lng}).`)
            const zoneStatus = await getLocationData(quotedMsg.lat, quotedMsg.lng)
            if (zoneStatus.kode !== 200) client.sendText(from, 'Maaf, Terjadi error ketika memeriksa lokasi yang anda kirim.')
            let data = ''
            for (let i = 0; i < zoneStatus.data.length; i++) {
                const { zone, region } = zoneStatus.data[i]
                const _zone = zone == 'green' ? 'Hijau* (Aman) \n' : zone == 'yellow' ? 'Kuning* (Waspada) \n' : 'Merah* (Bahaya) \n'
                data += `${i + 1}. Kel. *${region}* Berstatus *Zona ${_zone}`
            }
            const text = `*CEK LOKASI PENYEBARAN COVID-19*\nHasil pemeriksaan dari lokasi yang anda kirim adalah *${zoneStatus.status}* ${zoneStatus.optional}\n\nInformasi lokasi terdampak disekitar anda:\n${data}`
            client.sendText(from, text)
            break*/
        case 'help':
        case 'menu':
         client.sendFileFromUrl(from, 'https://i.ibb.co/3CpFxvb/bot.jpg', 'bot.jpg', `Hai *${pushname}*, Sebelum menggunakan bot ini silahkan membaca rules terlebih dahulu dengan ketik !rules.

 Berikut Beberapa Fitur Yang Tersedia Di Bot Ini :
➥!menu1 = Menu Utama.
➥!menu2 = Menu Admin Grup.
➥!menu3 = Menu  Downloader.
➥!menu4 = Menu Quotes.
➥!menu5 = Menu Penyegar Timeline.

Note : Semua Perintah Menggunakan Prefix !
Secreto: https://secreto.site/id/16154939

Jika Bot Ini Delay Silahkan Ke Bot : wa.me/6283123565817

Jika Ingin Donasi ketik !donasi untuk membantu agar bot tetap aktif dan menambah fitur`, message.id)
            break
            case 'menu1':
            client.reply(from, `Menu Utama:

➥!p (Pembuat Sticker)
➥!kucing 
➥!anjing
➥!pokemon
➥!tts [id,en,ar,jp] teks (Maks 300 Teks)
➥!wallpaper 
➥!covid
➥!lirik [judul lagu]
➥!botstat

Untuk Tutor Ketik !tutor`, message.id)
            break
            case 'menu2':
            client.reply(from, `Menu Admin Grup :
➥!add 628xxxx
➥!kick <@tagmember>
➥!ping <teks>
➥!promote <@tagmember>
➥!demote <@tagadmin>
➥!leave`, message.id)
            break
            case 'menu3':
            client.reply(from, `Menu Downloader :
➥!ig [link post]`, message.id)
            break
            case 'menu4':
            client.reply(from, `Menu Quotes :
➥!quotes
➥!qmaker |teks|author|`, message.id)
            break
            case 'menu5':
            client.reply(from, `Menu Penyegar Timeline :
➥!pptl`, message.id)
            break
            case 'tutor':
            client.reply(from, `Tutorial :

➥!p 
Membuat Stiker Dengan Mengirim/Membalas Gambar dengan Caption !p

➥!tts [id,en,ar,jp] teks
Mengubah Teks Menjadi Suara 
Contoh: !tts id Bot Nolep Banget

➥!lirik [judul lagu]
Mencari Lirik Lagu 
Contoh: !lirik on my way

➥!ig [link post]
Mendownload Single Post Photo/Video Instagram
Contoh: !ig https://www.instagram.com/p/B-Hd2gKppnN/?igshid=dccytqkzzspz

➥!qmaker |teks|author
Membuat Quotes Sederhana
Contoh: !qmaker |Anjay Bot|Bot Nolep

*Note: Perintah Tidak Menggunakan [] dan <>.`, message.id)
            break
        case 'info':
            client.sendText(from, `Hai ${pushname} Ini adalah program yang dibuat menggunakan javascript
tolong gunakan bot ini dengan bijak,jangan dispam karena akan membuat bot delay
gunakan seperlunya dan semua media yang kamu kirim tidak tersimpan di server kami
perintah yang kamu berikan kepada bot ini bukan tanggung jawab kami
jika ada masalah,hubungi wa.me/6289636035164
terima kasih:)`, message.id)
         break
         case 'rules': 
         client.reply(from, `Halo ${pushname}, Berikut Adalah Beberapa Rules Bot ini :
1.Bot ON Tergantung Mood
2.Jangan Spam Bot 
3.Kalo Bot NoRespon Jangan Rusuh 
4.Gunakan Bot dengan bijak
5.Semua Perintah Yang Kamu Kirim di proses otomatis oleh sistem
6.JANGAN TELPON BOT,KARENA AKAN KENA BLOCK otomatis

Dah Itu Aja`, message.id)
         break
         case 'donasi':
         client.reply(from, `Bagi Yang Mau Donasi Bisa Ke
Dana/OVO/Gopay ke Nomor: 089636035164
via Pulsa: 081296728103

Tidak Memaksa Anda Untuk Donasi,Terima Kasih ^_^`, message.id)
         break
        default:
            console.log(color('[ERROR]', 'red'), color(time, 'yellow'), 'Unregistered Command from', color(pushname))
            break
        }
    } catch (err) {
        console.log(color('[ERROR]', 'red'), err)
    }
}

startServer()
