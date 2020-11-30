import MasterCode from '@/masterCode';
import _ from 'lodash';

class DataManager {
    public static getInstance() {
        if (!this.instance) {
            this.instance = new DataManager();
        }
        return this.instance;
    }
    private static instance: DataManager;

    private masterCode: MasterCode[] = [];

    public setMasterCode(masterCode: MasterCode[]) {
        this.masterCode = masterCode;
        console.log(masterCode);
    }

    public getMasterCodeByName(name: string) {
        return _.find(this.masterCode, (x) => {
            return x.stockName === name;
        });
    }
}

export default DataManager.getInstance();
