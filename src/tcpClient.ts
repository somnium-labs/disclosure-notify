import net from 'net';
import JsonProtocol from '@/jsonProtocol';
import Events from 'events';

class TcpClient {
    public static getInstance() {
        if (!this.instance) {
            this.instance = new TcpClient();
        }
        return this.instance;
    }

    private static instance: TcpClient;
    private client: net.Socket = new net.Socket();
    private connected: boolean = false;
    private buffer: string = '';
    private callbacks: { [channel: string]: ((message: any) => void)[] } = {};
    private eventEmitter = new Events.EventEmitter();

    private constructor() {
        this.client.on('data', (data) => {
            this.buffer += data.toString();
            let index = -1;
            do {
                index = this.buffer.indexOf('<EOF>');
                if (-1 < index) {
                    const content = this.buffer.substring(0, index);
                    this.buffer = this.buffer.substring(index + 5);

                    const json: JsonProtocol = JSON.parse(content);
                    const callbacks = this.callbacks[json.channel];

                    this.eventEmitter.emit(json.channel, json.message);

                    if (callbacks !== undefined) {
                        callbacks.forEach((callback) => {
                            callback(json.message);
                        });
                    }
                }
            } while (-1 < index);
        });

        this.client.on('close', (error) => {
            if (error) {
                console.error('The socket was closed due to a transmission error.');
            } else {
                console.warn('The socket has been closed.');
            }
            this.connected = false;
        });

        // FIN
        this.client.on('end', () => {
            console.warn('end');
        });

        this.client.on('error', (err) => {
            console.error(err);
        });

        this.client.on('timeout', () => {
            console.warn('client Socket timeout: ');
        });

        // empty write buffer
        this.client.on('drain', () => {
            console.warn('client Socket drain: ');
        });

        this.client.on('lookup', () => {
            console.log('client Socket lookup: ');
        });
    }

    public isConnected() {
        return this.connected;
    }

    public connect(host: string, port: number) {
        return new Promise<void>((resolve, reject) => {
            try {
                this.client.connect(port, host, () => {
                    this.connected = true;
                    console.log(`Successfully connected to ${host}:${port}`);
                    resolve();
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }

    public send<T>(channel: string, message?: T) {
        return new Promise<void>((resolve, reject) => {
            const data: JsonProtocol = {
                channel: channel,
                message: message,
            };
            const json = JSON.stringify(data);
            const request = json + '<EOF>';
            this.client.write(request, (err) => {
                if (err) {
                    console.error(`Tcp data transmission failed: ${err}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     *
     * @param channel 메세지를 구분하기 위한 키
     * @param callback 콜백함수
     * @param T 콜백함수로 전달받을 데이터
     */
    public subscribe<T>(channel: string, callback: (message: T) => void) {
        if (this.callbacks[channel] === undefined) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].push(callback);
    }

    public responseWaiter<T>(eventName: string) {
        return new Promise<T>((resolve, reject) => {
            this.eventEmitter.on(eventName, (args: T) => {
                resolve(args);
            });
        });
    }

    public publish(name: string, args: any) {
        const callbacks = this.callbacks[name];

        if (callbacks !== undefined) {
            callbacks.forEach((callback) => {
                callback(args);
            });
        }
    }
}

export default TcpClient.getInstance();
