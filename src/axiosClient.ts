import axios, { AxiosInstance } from 'axios';

class AxiosClient {
    public readonly axiosInstance: AxiosInstance;

    public constructor() {
        this.axiosInstance = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
            },
        });
    }
}

export default new AxiosClient().axiosInstance;
