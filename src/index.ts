import DartDisposure from '@/dartDisclosure';
import tcp from '@/tcpClient';
import MasterCode from '@/masterCode';
import DataManager from '@/dataManager';

async function refresh() {
    await dart.refresh(3);
}

const dart = new DartDisposure();

tcp.subscribe('stock-items-response', (masterCode: MasterCode[]) => {
    DataManager.setMasterCode(masterCode);
});

tcp.connect('192.168.0.2', 13000);
tcp.send('stock-items-request');

// 3초에 한 번씩 공시정보 확인
setInterval(() => {
    refresh();
}, 3000);

// 매일 0시에 알림전송 리스트 초기화
// cron.schedule('0 0 * * *', () => {
//     listOfSentDisclosure.splice(0, listOfSentDisclosure.length);
//     console.log(`[${moment().format('YYYY-MM-DD')}] Disclosure has been initialized.`);
// });
