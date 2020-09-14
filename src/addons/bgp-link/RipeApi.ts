export class RipeApi {
    private readonly _storageKey = 'NatoWebRs::RipeApi::_asNameCache';
    private readonly _ripeApiBase = 'https://stat.ripe.net/data/';
    private _asNameCache: Object;

    private _unBlock: () => void = () => 0;
    private _running = false;

    private async blocker() {
        let p = new Promise((a, _) => {
            this._unBlock = () => {
                this._running = false;
                a();
            };
        });
        if (!this._running) this._unBlock();
        return p;
    }

    private async _ripeGet(url: string): Promise<Object> {
        await this.blocker();

        this._running = true;
        let xhr = new XMLHttpRequest();

        return new Promise((a, r) => {
            xhr.open('GET', `${this._ripeApiBase}${url}`);
            xhr.onerror = () => r('xhr failed.');
            xhr.onload = () => {
                this._unBlock();
                if (xhr.status == 200) {
                    let res = JSON.parse(xhr.response);
                    if (res.status === 'ok') a(res.data);
                    else r('RIPE API returned not-OK.');
                } else r('got non-200 response.');
            };
            xhr.send();
        });
    }

    public constructor() {
        let cache: string | null = localStorage.getItem(this._storageKey);
        this._asNameCache = cache ? JSON.parse(cache) : {};
    }

    public async getAsNames(asns: string[]): Promise<Object> {
        let targets = asns.map(asn => asn.replace('AS', '')).filter(asn => !Object.keys(this._asNameCache).includes(asn));

        if (targets.length > 0) {
            try {
                let data = await this._ripeGet(`as-names/data.json?resource=${targets.join(',')}`);
                this._asNameCache = Object.assign(this._asNameCache, data['names']);
            } catch (e) {
                console.warn(`error communicating with RIPE: ${e}`);
            }
        }

        localStorage.setItem(this._storageKey, JSON.stringify(this._asNameCache));
        return this._asNameCache;
    }

};