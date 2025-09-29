import qr from 'qr-image'

export let MyQRCodePath = "/QRCode/"


export function SetQRCodePath(envStr) {
    if (envStr) {
        if (envStr.search(/^\/[a-zA-Z0-9]+\/$/i) === 0) {
            MyQRCodePath = envStr;
        }
    }
}

export async function generateQRCode({ text }) {

    const headers = { 'Content-Type': 'image/png' };
    const qr_png = qr.imageSync(text || 'NULL');

    return new Response(qr_png, { headers });

}