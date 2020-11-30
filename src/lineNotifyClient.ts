import axios from '@/axiosClient';

export default class LineNotifyClient {
    private static readonly TOKEN: string = '3ZucisDG4dJdB3VMfDJAl5ntI4xpQKLMjSH282yp5Ol';
    public static async send(message: string) {
        try {
            await axios.post('https://notify-api.line.me/api/notify', `message=${message}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${LineNotifyClient.TOKEN}` },
            });
        } catch (error) {
            console.log(error);
        }
    }
}
