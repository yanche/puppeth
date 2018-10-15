
import * as mongodb from "mongodb";
import { Hub } from "@belongs/asyncutil";
import * as url from "url";
// import * as validate from "./validate";

export class CollClient<T> {
    private readonly _colhub: Hub<mongodb.Collection>;
    private readonly _fields: Object;

    public async getAll(filter: Object, fields?: Object): Promise<Array<T>> {
        const col = await this._colhub.get();
        return new Promise<Array<T>>((res, rej) => {
            const cursor = col.find(filter, fields || this._fields);
            cursor.toArray((err: Error, docs: Array<T>) => {
                err ? rej(err) : res(docs);
            })
        });
    }

    public async updateAll(filter: Object, update: Object): Promise<number> {
        const col = await this._colhub.get();
        return new Promise<number>((res, rej) => {
            col.updateMany(filter, update, null, (err: Error, ret: mongodb.UpdateWriteOpResult) => {
                err ? rej(err) : res(ret.modifiedCount);
            });
        });
    }

    public async count(filter: Object = {}): Promise<number> {
        const col = await this._colhub.get();
        return new Promise<number>((res, rej) => {
            col.countDocuments(filter, (err: Error, ct: number) => {
                err ? rej(err) : res(ct);
            });
        });
    }

    public async bulkInsert(arr: Array<T>): Promise<Array<mongodb.ObjectID>> {
        const col = await this._colhub.get();
        const bulk = col.initializeUnorderedBulkOp();
        for (const item of arr) {
            bulk.insert(item);
        }
        return new Promise<Array<mongodb.ObjectID>>((res, rej) => {
            bulk.execute((err: Error, ret: mongodb.BulkWriteResult) => {
                if (err) {
                    rej(err);
                } else {
                    res((<Array<{ _id: mongodb.ObjectID }>>ret.getInsertedIds()).map(x => x._id));
                }
            });
        });
    }

    constructor(dbhub: Hub<mongodb.Db>, collname: string, fields: Object) {
        this._colhub = new Hub<mongodb.Collection>(() => dbhub.get().then(db => db.collection(collname)));
        this._fields = fields;
    }
}

export class DbClient {
    private readonly _connstr: string;
    private readonly _dbhub: Hub<mongodb.Db>;

    public getCollClient<T>(collname: string, fields: Object): CollClient<T> {
        return new CollClient<T>(this._dbhub, collname, fields);
    }

    constructor(connstr: string) {
        this._connstr = connstr;
        this._dbhub = new Hub<mongodb.Db>(async () => {
            const client = await mongodb.connect(connstr, { useNewUrlParser: true });
            return client.db(dbNameFromUrl(connstr));
        });
    }
}

function dbNameFromUrl(connstr: string): string {
    const pathname = url.parse(connstr).pathname;
    return pathname[0] === "/" ? pathname.slice(1) : pathname;
}
