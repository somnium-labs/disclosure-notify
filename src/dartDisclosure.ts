import axios from '@/axiosClient';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import _ from 'lodash';
import moment from 'moment';
import lnc from '@/lineNotifyClient';

export default class DartDisposure {
    private processedList: string[] = [];

    public async refresh(dayCount: number) {
        await this.getDisclosureList(dayCount, 1);
    }

    private async getDisclosureList(dayCount: number, currentPage: number) {
        const mt: moment.Moment = moment();
        const date: string = mt.subtract(dayCount, 'd').format('YYYY-MM-DD');
        const response = await axios.get(`http://dart.fss.or.kr/dsac001/search.ax`, {
            params: {
                mdayCnt: dayCount,
                currentPage: currentPage,
            },
        });
        const $ = cheerio.load(response.data);
        const rows = $('div table tr');
        $(rows).each(async (index, element) => {
            const columns = $(element).find('td');
            if (0 < columns.length) {
                const market = $(columns[1]).find('span img')?.attr('alt');
                if (market?.includes('유가') || market?.includes('코스닥')) {
                    const time = $(columns[0]).text().trim();
                    const company = $(columns[1]).text().trim();
                    const title = $(columns[2]).text().trim();

                    if (!title.includes('정정') && title.includes('공급계약체결')) {
                        const url = $(columns[2]).find('a')?.attr('href');
                        if (url) {
                            // 이미 처리한 공시인지 확인
                            const disclosure = _.find(this.processedList, (x) => {
                                if (x === url) {
                                    return x;
                                }
                            });

                            // 처리 하지 않았던 공시만 처리
                            if (!disclosure) {
                                this.processedList.push(url);
                                await this.openReport(url, date, time, company, title);
                            }
                        }
                    }
                }
            }
        });

        const pageInfo = $('p.page_info').text();
        // '\n\t\t[1/5] [총 460건]\n\t'
        const re = /\[\d+\/(\d+)\]/;
        const matched = pageInfo.match(re);
        if (matched) {
            return parseInt(matched[1], 10);
        }

        return 1;
    }

    private async openReport(url: string, date: string, time: string, company: string, title: string) {
        const response = await axios.get(`http://dart.fss.or.kr${url}`);
        const re = /'(\d+)', '(\d+)'/;
        const data: string = response.data;
        const matched = data.match(re);
        if (matched) {
            const rcpNo = matched[1];
            const dcmNo = matched[2];
            this.openReportHtml(rcpNo, dcmNo, date, time, company, title);
        }
    }

    private async openReportHtml(rcpNo: string, dcmNo: string, date: string, time: string, company: string, title: string) {
        const url = `http://dart.fss.or.kr/report/viewer.do?rcpNo=${rcpNo}&dcmNo=${dcmNo}&eleId=0&offset=0&length=0&dtd=HTML`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const data = iconv.decode(Buffer.from(response.data), 'euc-kr');

        let contractAmount: string = '';
        let contractBeginDate: string = '';
        let contractEndDate: string = '';
        let comparedTosales: string = '';

        const $ = cheerio.load(data);
        const rows = $('div table tr');
        $(rows).each(async (index, element) => {
            const columns = $(element).find('td');
            $(columns).each((i, e) => {
                const column = $(e);
                if (contractAmount === '' && column.text().trim().includes('계약금액')) {
                    contractAmount = `${column.next().text().trim()}`;
                } else if (comparedTosales === '' && column.text().trim().includes('대비')) {
                    comparedTosales = `${column.next().text().trim()}`;
                } else if (contractBeginDate === '' && column.text().trim().includes('시작')) {
                    contractBeginDate = `${column.next().text().trim()}`;
                } else if (contractEndDate === '' && column.text().trim().includes('종료')) {
                    contractEndDate = `${column.next().text().trim()}`;
                }
            });
        });

        lnc.send(`DART\n회사: ${company}\n제목: ${title}\n계약금액: ${contractAmount}\n매출액대비: ${comparedTosales}\n시작일: ${contractBeginDate}\n종료일: ${contractEndDate}`);

        console.log(`${date} ${time}\t${company}\t${contractAmount}\t${comparedTosales}\t${contractBeginDate}\t${contractEndDate}`);
    }
}
