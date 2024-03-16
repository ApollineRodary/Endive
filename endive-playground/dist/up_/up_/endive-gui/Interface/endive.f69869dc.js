class X {
    lineAt(e) {
        if (e < 0 || e > this.length) throw new RangeError(`Invalid position ${e} in document of length ${this.length}`);
        return this.lineInner(e, !1, 1, 0);
    }
    line(e) {
        if (e < 1 || e > this.lines) throw new RangeError(`Invalid line number ${e} in ${this.lines}-line document`);
        return this.lineInner(e, !0, 1, 0);
    }
    replace(e, t, n) {
        let r = [];
        return this.decompose(0, e, r, 2), n.length && n.decompose(0, n.length, r, 3), this.decompose(t, this.length, r, 1), Bt.from(r, this.length - (t - e) + n.length);
    }
    append(e) {
        return this.replace(this.length, this.length, e);
    }
    slice(e, t = this.length) {
        let n = [];
        return this.decompose(e, t, n, 0), Bt.from(n, t - e);
    }
    eq(e) {
        if (e == this) return !0;
        if (e.length != this.length || e.lines != this.lines) return !1;
        let t = this.scanIdentical(e, 1), n = this.length - this.scanIdentical(e, -1), r = new cr(this), s = new cr(e);
        for(let o = t, l = t;;){
            if (r.next(o), s.next(o), o = 0, r.lineBreak != s.lineBreak || r.done != s.done || r.value != s.value) return !1;
            if (l += r.value.length, r.done || l >= n) return !0;
        }
    }
    iter(e = 1) {
        return new cr(this, e);
    }
    iterRange(e, t = this.length) {
        return new md(this, e, t);
    }
    iterLines(e, t) {
        let n;
        if (e == null) n = this.iter();
        else {
            t == null && (t = this.lines + 1);
            let r = this.line(e).from;
            n = this.iterRange(r, Math.max(r, t == this.lines + 1 ? this.length : t <= 1 ? 0 : this.line(t - 1).to));
        }
        return new yd(n);
    }
    toString() {
        return this.sliceString(0);
    }
    toJSON() {
        let e = [];
        return this.flatten(e), e;
    }
    constructor(){}
    static of(e) {
        if (e.length == 0) throw new RangeError("A document must have at least one line");
        return e.length == 1 && !e[0] ? X.empty : e.length <= 32 ? new Ce(e) : Bt.from(Ce.split(e, []));
    }
}
class Ce extends X {
    constructor(e, t = vm(e)){
        super(), this.text = e, this.length = t;
    }
    get lines() {
        return this.text.length;
    }
    get children() {
        return null;
    }
    lineInner(e, t, n, r) {
        for(let s = 0;; s++){
            let o = this.text[s], l = r + o.length;
            if ((t ? n : l) >= e) return new wm(r, l, n, o);
            r = l + 1, n++;
        }
    }
    decompose(e, t, n, r) {
        let s = e <= 0 && t >= this.length ? this : new Ce(Uc(this.text, e, t), Math.min(t, this.length) - Math.max(0, e));
        if (r & 1) {
            let o = n.pop(), l = Rs(s.text, o.text.slice(), 0, s.length);
            if (l.length <= 32) n.push(new Ce(l, o.length + s.length));
            else {
                let a = l.length >> 1;
                n.push(new Ce(l.slice(0, a)), new Ce(l.slice(a)));
            }
        } else n.push(s);
    }
    replace(e, t, n) {
        if (!(n instanceof Ce)) return super.replace(e, t, n);
        let r = Rs(this.text, Rs(n.text, Uc(this.text, 0, e)), t), s = this.length + n.length - (t - e);
        return r.length <= 32 ? new Ce(r, s) : Bt.from(Ce.split(r, []), s);
    }
    sliceString(e, t = this.length, n = `
`) {
        let r = "";
        for(let s = 0, o = 0; s <= t && o < this.text.length; o++){
            let l = this.text[o], a = s + l.length;
            s > e && o && (r += n), e < a && t > s && (r += l.slice(Math.max(0, e - s), t - s)), s = a + 1;
        }
        return r;
    }
    flatten(e) {
        for (let t of this.text)e.push(t);
    }
    scanIdentical() {
        return 0;
    }
    static split(e, t) {
        let n = [], r = -1;
        for (let s of e)n.push(s), r += s.length + 1, n.length == 32 && (t.push(new Ce(n, r)), n = [], r = -1);
        return r > -1 && t.push(new Ce(n, r)), t;
    }
}
class Bt extends X {
    constructor(e, t){
        super(), this.children = e, this.length = t, this.lines = 0;
        for (let n of e)this.lines += n.lines;
    }
    lineInner(e, t, n, r) {
        for(let s = 0;; s++){
            let o = this.children[s], l = r + o.length, a = n + o.lines - 1;
            if ((t ? a : l) >= e) return o.lineInner(e, t, n, r);
            r = l + 1, n = a + 1;
        }
    }
    decompose(e, t, n, r) {
        for(let s = 0, o = 0; o <= t && s < this.children.length; s++){
            let l = this.children[s], a = o + l.length;
            if (e <= a && t >= o) {
                let c = r & ((o <= e ? 1 : 0) | (a >= t ? 2 : 0));
                o >= e && a <= t && !c ? n.push(l) : l.decompose(e - o, t - o, n, c);
            }
            o = a + 1;
        }
    }
    replace(e, t, n) {
        if (n.lines < this.lines) for(let r = 0, s = 0; r < this.children.length; r++){
            let o = this.children[r], l = s + o.length;
            if (e >= s && t <= l) {
                let a = o.replace(e - s, t - s, n), c = this.lines - o.lines + a.lines;
                if (a.lines < c >> 4 && a.lines > c >> 6) {
                    let h = this.children.slice();
                    return h[r] = a, new Bt(h, this.length - (t - e) + n.length);
                }
                return super.replace(s, l, a);
            }
            s = l + 1;
        }
        return super.replace(e, t, n);
    }
    sliceString(e, t = this.length, n = `
`) {
        let r = "";
        for(let s = 0, o = 0; s < this.children.length && o <= t; s++){
            let l = this.children[s], a = o + l.length;
            o > e && s && (r += n), e < a && t > o && (r += l.sliceString(e - o, t - o, n)), o = a + 1;
        }
        return r;
    }
    flatten(e) {
        for (let t of this.children)t.flatten(e);
    }
    scanIdentical(e, t) {
        if (!(e instanceof Bt)) return 0;
        let n = 0, [r, s, o, l] = t > 0 ? [
            0,
            0,
            this.children.length,
            e.children.length
        ] : [
            this.children.length - 1,
            e.children.length - 1,
            -1,
            -1
        ];
        for(;; r += t, s += t){
            if (r == o || s == l) return n;
            let a = this.children[r], c = e.children[s];
            if (a != c) return n + a.scanIdentical(c, t);
            n += a.length + 1;
        }
    }
    static from(e, t = e.reduce((n, r)=>n + r.length + 1, -1)) {
        let n = 0;
        for (let d of e)n += d.lines;
        if (n < 32) {
            let d = [];
            for (let p of e)p.flatten(d);
            return new Ce(d, t);
        }
        let r = Math.max(32, n >> 5), s = r << 1, o = r >> 1, l = [], a = 0, c = -1, h = [];
        function u(d) {
            let p;
            if (d.lines > s && d instanceof Bt) for (let y of d.children)u(y);
            else d.lines > o && (a > o || !a) ? (f(), l.push(d)) : d instanceof Ce && a && (p = h[h.length - 1]) instanceof Ce && d.lines + p.lines <= 32 ? (a += d.lines, c += d.length + 1, h[h.length - 1] = new Ce(p.text.concat(d.text), p.length + 1 + d.length)) : (a + d.lines > r && f(), a += d.lines, c += d.length + 1, h.push(d));
        }
        function f() {
            a != 0 && (l.push(h.length == 1 ? h[0] : Bt.from(h, c)), c = -1, a = h.length = 0);
        }
        for (let d of e)u(d);
        return f(), l.length == 1 ? l[0] : new Bt(l, t);
    }
}
X.empty = new Ce([
    ""
], 0);
function vm(i) {
    let e = -1;
    for (let t of i)e += t.length + 1;
    return e;
}
function Rs(i, e, t = 0, n = 1e9) {
    for(let r = 0, s = 0, o = !0; s < i.length && r <= n; s++){
        let l = i[s], a = r + l.length;
        a >= t && (a > n && (l = l.slice(0, n - r)), r < t && (l = l.slice(t - r)), o ? (e[e.length - 1] += l, o = !1) : e.push(l)), r = a + 1;
    }
    return e;
}
function Uc(i, e, t) {
    return Rs(i, [
        ""
    ], e, t);
}
class cr {
    constructor(e, t = 1){
        this.dir = t, this.done = !1, this.lineBreak = !1, this.value = "", this.nodes = [
            e
        ], this.offsets = [
            t > 0 ? 1 : (e instanceof Ce ? e.text.length : e.children.length) << 1
        ];
    }
    nextInner(e, t) {
        for(this.done = this.lineBreak = !1;;){
            let n = this.nodes.length - 1, r = this.nodes[n], s = this.offsets[n], o = s >> 1, l = r instanceof Ce ? r.text.length : r.children.length;
            if (o == (t > 0 ? l : 0)) {
                if (n == 0) return this.done = !0, this.value = "", this;
                t > 0 && this.offsets[n - 1]++, this.nodes.pop(), this.offsets.pop();
            } else if ((s & 1) == (t > 0 ? 0 : 1)) {
                if (this.offsets[n] += t, e == 0) return this.lineBreak = !0, this.value = `
`, this;
                e--;
            } else if (r instanceof Ce) {
                let a = r.text[o + (t < 0 ? -1 : 0)];
                if (this.offsets[n] += t, a.length > Math.max(0, e)) return this.value = e == 0 ? a : t > 0 ? a.slice(e) : a.slice(0, a.length - e), this;
                e -= a.length;
            } else {
                let a = r.children[o + (t < 0 ? -1 : 0)];
                e > a.length ? (e -= a.length, this.offsets[n] += t) : (t < 0 && this.offsets[n]--, this.nodes.push(a), this.offsets.push(t > 0 ? 1 : (a instanceof Ce ? a.text.length : a.children.length) << 1));
            }
        }
    }
    next(e = 0) {
        return e < 0 && (this.nextInner(-e, -this.dir), e = this.value.length), this.nextInner(e, this.dir);
    }
}
class md {
    constructor(e, t, n){
        this.value = "", this.done = !1, this.cursor = new cr(e, t > n ? -1 : 1), this.pos = t > n ? e.length : 0, this.from = Math.min(t, n), this.to = Math.max(t, n);
    }
    nextInner(e, t) {
        if (t < 0 ? this.pos <= this.from : this.pos >= this.to) return this.value = "", this.done = !0, this;
        e += Math.max(0, t < 0 ? this.pos - this.to : this.from - this.pos);
        let n = t < 0 ? this.pos - this.from : this.to - this.pos;
        e > n && (e = n), n -= e;
        let { value: r } = this.cursor.next(e);
        return this.pos += (r.length + e) * t, this.value = r.length <= n ? r : t < 0 ? r.slice(r.length - n) : r.slice(0, n), this.done = !this.value, this;
    }
    next(e = 0) {
        return e < 0 ? e = Math.max(e, this.from - this.pos) : e > 0 && (e = Math.min(e, this.to - this.pos)), this.nextInner(e, this.cursor.dir);
    }
    get lineBreak() {
        return this.cursor.lineBreak && this.value != "";
    }
}
class yd {
    constructor(e){
        this.inner = e, this.afterBreak = !0, this.value = "", this.done = !1;
    }
    next(e = 0) {
        let { done: t, lineBreak: n, value: r } = this.inner.next(e);
        return t ? (this.done = !0, this.value = "") : n ? this.afterBreak ? this.value = "" : (this.afterBreak = !0, this.next()) : (this.value = r, this.afterBreak = !1), this;
    }
    get lineBreak() {
        return !1;
    }
}
typeof Symbol < "u" && (X.prototype[Symbol.iterator] = function() {
    return this.iter();
}, cr.prototype[Symbol.iterator] = md.prototype[Symbol.iterator] = yd.prototype[Symbol.iterator] = function() {
    return this;
});
class wm {
    constructor(e, t, n, r){
        this.from = e, this.to = t, this.number = n, this.text = r;
    }
    get length() {
        return this.to - this.from;
    }
}
let cn = "lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map((i)=>i ? parseInt(i, 36) : 1);
for(let i = 1; i < cn.length; i++)cn[i] += cn[i - 1];
function km(i) {
    for(let e = 1; e < cn.length; e += 2)if (cn[e] > i) return cn[e - 1] <= i;
    return !1;
}
function Kc(i) {
    return i >= 127462 && i <= 127487;
}
const Gc = 8205;
function Xe(i, e, t = !0, n = !0) {
    return (t ? bd : Sm)(i, e, n);
}
function bd(i, e, t) {
    if (e == i.length) return e;
    e && vd(i.charCodeAt(e)) && wd(i.charCodeAt(e - 1)) && e--;
    let n = wt(i, e);
    for(e += fi(n); e < i.length;){
        let r = wt(i, e);
        if (n == Gc || r == Gc || t && km(r)) e += fi(r), n = r;
        else if (Kc(r)) {
            let s = 0, o = e - 2;
            for(; o >= 0 && Kc(wt(i, o));)s++, o -= 2;
            if (s % 2 == 0) break;
            e += 2;
        } else break;
    }
    return e;
}
function Sm(i, e, t) {
    for(; e > 0;){
        let n = bd(i, e - 2, t);
        if (n < e) return n;
        e--;
    }
    return 0;
}
function vd(i) {
    return i >= 56320 && i < 57344;
}
function wd(i) {
    return i >= 55296 && i < 56320;
}
function wt(i, e) {
    let t = i.charCodeAt(e);
    if (!wd(t) || e + 1 == i.length) return t;
    let n = i.charCodeAt(e + 1);
    return vd(n) ? (t - 55296 << 10) + (n - 56320) + 65536 : t;
}
function Cm(i) {
    return i <= 65535 ? String.fromCharCode(i) : (i -= 65536, String.fromCharCode((i >> 10) + 55296, (i & 1023) + 56320));
}
function fi(i) {
    return i < 65536 ? 1 : 2;
}
const pl = /\r\n?|\n/;
var Ye = function(i) {
    return i[i.Simple = 0] = "Simple", i[i.TrackDel = 1] = "TrackDel", i[i.TrackBefore = 2] = "TrackBefore", i[i.TrackAfter = 3] = "TrackAfter", i;
}(Ye || (Ye = {}));
class Ht {
    constructor(e){
        this.sections = e;
    }
    get length() {
        let e = 0;
        for(let t = 0; t < this.sections.length; t += 2)e += this.sections[t];
        return e;
    }
    get newLength() {
        let e = 0;
        for(let t = 0; t < this.sections.length; t += 2){
            let n = this.sections[t + 1];
            e += n < 0 ? this.sections[t] : n;
        }
        return e;
    }
    get empty() {
        return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0;
    }
    iterGaps(e) {
        for(let t = 0, n = 0, r = 0; t < this.sections.length;){
            let s = this.sections[t++], o = this.sections[t++];
            o < 0 ? (e(n, r, s), r += s) : r += o, n += s;
        }
    }
    iterChangedRanges(e, t = !1) {
        gl(this, e, t);
    }
    get invertedDesc() {
        let e = [];
        for(let t = 0; t < this.sections.length;){
            let n = this.sections[t++], r = this.sections[t++];
            r < 0 ? e.push(n, r) : e.push(r, n);
        }
        return new Ht(e);
    }
    composeDesc(e) {
        return this.empty ? e : e.empty ? this : kd(this, e);
    }
    mapDesc(e, t = !1) {
        return e.empty ? this : ml(this, e, t);
    }
    mapPos(e, t = -1, n = Ye.Simple) {
        let r = 0, s = 0;
        for(let o = 0; o < this.sections.length;){
            let l = this.sections[o++], a = this.sections[o++], c = r + l;
            if (a < 0) {
                if (c > e) return s + (e - r);
                s += l;
            } else {
                if (n != Ye.Simple && c >= e && (n == Ye.TrackDel && r < e && c > e || n == Ye.TrackBefore && r < e || n == Ye.TrackAfter && c > e)) return null;
                if (c > e || c == e && t < 0 && !l) return e == r || t < 0 ? s : s + a;
                s += a;
            }
            r = c;
        }
        if (e > r) throw new RangeError(`Position ${e} is out of range for changeset of length ${r}`);
        return s;
    }
    touchesRange(e, t = e) {
        for(let n = 0, r = 0; n < this.sections.length && r <= t;){
            let s = this.sections[n++], o = this.sections[n++], l = r + s;
            if (o >= 0 && r <= t && l >= e) return r < e && l > t ? "cover" : !0;
            r = l;
        }
        return !1;
    }
    toString() {
        let e = "";
        for(let t = 0; t < this.sections.length;){
            let n = this.sections[t++], r = this.sections[t++];
            e += (e ? " " : "") + n + (r >= 0 ? ":" + r : "");
        }
        return e;
    }
    toJSON() {
        return this.sections;
    }
    static fromJSON(e) {
        if (!Array.isArray(e) || e.length % 2 || e.some((t)=>typeof t != "number")) throw new RangeError("Invalid JSON representation of ChangeDesc");
        return new Ht(e);
    }
    static create(e) {
        return new Ht(e);
    }
}
class De extends Ht {
    constructor(e, t){
        super(e), this.inserted = t;
    }
    apply(e) {
        if (this.length != e.length) throw new RangeError("Applying change set to a document with the wrong length");
        return gl(this, (t, n, r, s, o)=>e = e.replace(r, r + (n - t), o), !1), e;
    }
    mapDesc(e, t = !1) {
        return ml(this, e, t, !0);
    }
    invert(e) {
        let t = this.sections.slice(), n = [];
        for(let r = 0, s = 0; r < t.length; r += 2){
            let o = t[r], l = t[r + 1];
            if (l >= 0) {
                t[r] = l, t[r + 1] = o;
                let a = r >> 1;
                for(; n.length < a;)n.push(X.empty);
                n.push(o ? e.slice(s, s + o) : X.empty);
            }
            s += o;
        }
        return new De(t, n);
    }
    compose(e) {
        return this.empty ? e : e.empty ? this : kd(this, e, !0);
    }
    map(e, t = !1) {
        return e.empty ? this : ml(this, e, t, !0);
    }
    iterChanges(e, t = !1) {
        gl(this, e, t);
    }
    get desc() {
        return Ht.create(this.sections);
    }
    filter(e) {
        let t = [], n = [], r = [], s = new fr(this);
        e: for(let o = 0, l = 0;;){
            let a = o == e.length ? 1e9 : e[o++];
            for(; l < a || l == a && s.len == 0;){
                if (s.done) break e;
                let h = Math.min(s.len, a - l);
                je(r, h, -1);
                let u = s.ins == -1 ? -1 : s.off == 0 ? s.ins : 0;
                je(t, h, u), u > 0 && pi(n, t, s.text), s.forward(h), l += h;
            }
            let c = e[o++];
            for(; l < c;){
                if (s.done) break e;
                let h = Math.min(s.len, c - l);
                je(t, h, -1), je(r, h, s.ins == -1 ? -1 : s.off == 0 ? s.ins : 0), s.forward(h), l += h;
            }
        }
        return {
            changes: new De(t, n),
            filtered: Ht.create(r)
        };
    }
    toJSON() {
        let e = [];
        for(let t = 0; t < this.sections.length; t += 2){
            let n = this.sections[t], r = this.sections[t + 1];
            r < 0 ? e.push(n) : r == 0 ? e.push([
                n
            ]) : e.push([
                n
            ].concat(this.inserted[t >> 1].toJSON()));
        }
        return e;
    }
    static of(e, t, n) {
        let r = [], s = [], o = 0, l = null;
        function a(h = !1) {
            if (!h && !r.length) return;
            o < t && je(r, t - o, -1);
            let u = new De(r, s);
            l = l ? l.compose(u.map(l)) : u, r = [], s = [], o = 0;
        }
        function c(h) {
            if (Array.isArray(h)) for (let u of h)c(u);
            else if (h instanceof De) {
                if (h.length != t) throw new RangeError(`Mismatched change set length (got ${h.length}, expected ${t})`);
                a(), l = l ? l.compose(h.map(l)) : h;
            } else {
                let { from: u, to: f = u, insert: d } = h;
                if (u > f || u < 0 || f > t) throw new RangeError(`Invalid change range ${u} to ${f} (in doc of length ${t})`);
                let p = d ? typeof d == "string" ? X.of(d.split(n || pl)) : d : X.empty, y = p.length;
                if (u == f && y == 0) return;
                u < o && a(), u > o && je(r, u - o, -1), je(r, f - u, y), pi(s, r, p), o = f;
            }
        }
        return c(e), a(!l), l;
    }
    static empty(e) {
        return new De(e ? [
            e,
            -1
        ] : [], []);
    }
    static fromJSON(e) {
        if (!Array.isArray(e)) throw new RangeError("Invalid JSON representation of ChangeSet");
        let t = [], n = [];
        for(let r = 0; r < e.length; r++){
            let s = e[r];
            if (typeof s == "number") t.push(s, -1);
            else {
                if (!Array.isArray(s) || typeof s[0] != "number" || s.some((o, l)=>l && typeof o != "string")) throw new RangeError("Invalid JSON representation of ChangeSet");
                if (s.length == 1) t.push(s[0], 0);
                else {
                    for(; n.length < r;)n.push(X.empty);
                    n[r] = X.of(s.slice(1)), t.push(s[0], n[r].length);
                }
            }
        }
        return new De(t, n);
    }
    static createSet(e, t) {
        return new De(e, t);
    }
}
function je(i, e, t, n = !1) {
    if (e == 0 && t <= 0) return;
    let r = i.length - 2;
    r >= 0 && t <= 0 && t == i[r + 1] ? i[r] += e : e == 0 && i[r] == 0 ? i[r + 1] += t : n ? (i[r] += e, i[r + 1] += t) : i.push(e, t);
}
function pi(i, e, t) {
    if (t.length == 0) return;
    let n = e.length - 2 >> 1;
    if (n < i.length) i[i.length - 1] = i[i.length - 1].append(t);
    else {
        for(; i.length < n;)i.push(X.empty);
        i.push(t);
    }
}
function gl(i, e, t) {
    let n = i.inserted;
    for(let r = 0, s = 0, o = 0; o < i.sections.length;){
        let l = i.sections[o++], a = i.sections[o++];
        if (a < 0) r += l, s += l;
        else {
            let c = r, h = s, u = X.empty;
            for(; c += l, h += a, a && n && (u = u.append(n[o - 2 >> 1])), !(t || o == i.sections.length || i.sections[o + 1] < 0);)l = i.sections[o++], a = i.sections[o++];
            e(r, c, s, h, u), r = c, s = h;
        }
    }
}
function ml(i, e, t, n = !1) {
    let r = [], s = n ? [] : null, o = new fr(i), l = new fr(e);
    for(let a = -1;;)if (o.ins == -1 && l.ins == -1) {
        let c = Math.min(o.len, l.len);
        je(r, c, -1), o.forward(c), l.forward(c);
    } else if (l.ins >= 0 && (o.ins < 0 || a == o.i || o.off == 0 && (l.len < o.len || l.len == o.len && !t))) {
        let c = l.len;
        for(je(r, l.ins, -1); c;){
            let h = Math.min(o.len, c);
            o.ins >= 0 && a < o.i && o.len <= h && (je(r, 0, o.ins), s && pi(s, r, o.text), a = o.i), o.forward(h), c -= h;
        }
        l.next();
    } else if (o.ins >= 0) {
        let c = 0, h = o.len;
        for(; h;)if (l.ins == -1) {
            let u = Math.min(h, l.len);
            c += u, h -= u, l.forward(u);
        } else if (l.ins == 0 && l.len < h) h -= l.len, l.next();
        else break;
        je(r, c, a < o.i ? o.ins : 0), s && a < o.i && pi(s, r, o.text), a = o.i, o.forward(o.len - h);
    } else {
        if (o.done && l.done) return s ? De.createSet(r, s) : Ht.create(r);
        throw new Error("Mismatched change set lengths");
    }
}
function kd(i, e, t = !1) {
    let n = [], r = t ? [] : null, s = new fr(i), o = new fr(e);
    for(let l = !1;;){
        if (s.done && o.done) return r ? De.createSet(n, r) : Ht.create(n);
        if (s.ins == 0) je(n, s.len, 0, l), s.next();
        else if (o.len == 0 && !o.done) je(n, 0, o.ins, l), r && pi(r, n, o.text), o.next();
        else {
            if (s.done || o.done) throw new Error("Mismatched change set lengths");
            {
                let a = Math.min(s.len2, o.len), c = n.length;
                if (s.ins == -1) {
                    let h = o.ins == -1 ? -1 : o.off ? 0 : o.ins;
                    je(n, a, h, l), r && h && pi(r, n, o.text);
                } else o.ins == -1 ? (je(n, s.off ? 0 : s.len, a, l), r && pi(r, n, s.textBit(a))) : (je(n, s.off ? 0 : s.len, o.off ? 0 : o.ins, l), r && !o.off && pi(r, n, o.text));
                l = (s.ins > a || o.ins >= 0 && o.len > a) && (l || n.length > c), s.forward2(a), o.forward(a);
            }
        }
    }
}
class fr {
    constructor(e){
        this.set = e, this.i = 0, this.next();
    }
    next() {
        let { sections: e } = this.set;
        this.i < e.length ? (this.len = e[this.i++], this.ins = e[this.i++]) : (this.len = 0, this.ins = -2), this.off = 0;
    }
    get done() {
        return this.ins == -2;
    }
    get len2() {
        return this.ins < 0 ? this.len : this.ins;
    }
    get text() {
        let { inserted: e } = this.set, t = this.i - 2 >> 1;
        return t >= e.length ? X.empty : e[t];
    }
    textBit(e) {
        let { inserted: t } = this.set, n = this.i - 2 >> 1;
        return n >= t.length && !e ? X.empty : t[n].slice(this.off, e == null ? void 0 : this.off + e);
    }
    forward(e) {
        e == this.len ? this.next() : (this.len -= e, this.off += e);
    }
    forward2(e) {
        this.ins == -1 ? this.forward(e) : e == this.ins ? this.next() : (this.ins -= e, this.off += e);
    }
}
let rs = class yl {
    constructor(e, t, n){
        this.from = e, this.to = t, this.flags = n;
    }
    get anchor() {
        return this.flags & 32 ? this.to : this.from;
    }
    get head() {
        return this.flags & 32 ? this.from : this.to;
    }
    get empty() {
        return this.from == this.to;
    }
    get assoc() {
        return this.flags & 8 ? -1 : this.flags & 16 ? 1 : 0;
    }
    get bidiLevel() {
        let e = this.flags & 7;
        return e == 7 ? null : e;
    }
    get goalColumn() {
        let e = this.flags >> 6;
        return e == 16777215 ? void 0 : e;
    }
    map(e, t = -1) {
        let n, r;
        return this.empty ? n = r = e.mapPos(this.from, t) : (n = e.mapPos(this.from, 1), r = e.mapPos(this.to, -1)), n == this.from && r == this.to ? this : new yl(n, r, this.flags);
    }
    extend(e, t = e) {
        if (e <= this.anchor && t >= this.anchor) return O.range(e, t);
        let n = Math.abs(e - this.anchor) > Math.abs(t - this.anchor) ? e : t;
        return O.range(this.anchor, n);
    }
    eq(e) {
        return this.anchor == e.anchor && this.head == e.head;
    }
    toJSON() {
        return {
            anchor: this.anchor,
            head: this.head
        };
    }
    static fromJSON(e) {
        if (!e || typeof e.anchor != "number" || typeof e.head != "number") throw new RangeError("Invalid JSON representation for SelectionRange");
        return O.range(e.anchor, e.head);
    }
    static create(e, t, n) {
        return new yl(e, t, n);
    }
};
class O {
    constructor(e, t){
        this.ranges = e, this.mainIndex = t;
    }
    map(e, t = -1) {
        return e.empty ? this : O.create(this.ranges.map((n)=>n.map(e, t)), this.mainIndex);
    }
    eq(e) {
        if (this.ranges.length != e.ranges.length || this.mainIndex != e.mainIndex) return !1;
        for(let t = 0; t < this.ranges.length; t++)if (!this.ranges[t].eq(e.ranges[t])) return !1;
        return !0;
    }
    get main() {
        return this.ranges[this.mainIndex];
    }
    asSingle() {
        return this.ranges.length == 1 ? this : new O([
            this.main
        ], 0);
    }
    addRange(e, t = !0) {
        return O.create([
            e
        ].concat(this.ranges), t ? 0 : this.mainIndex + 1);
    }
    replaceRange(e, t = this.mainIndex) {
        let n = this.ranges.slice();
        return n[t] = e, O.create(n, this.mainIndex);
    }
    toJSON() {
        return {
            ranges: this.ranges.map((e)=>e.toJSON()),
            main: this.mainIndex
        };
    }
    static fromJSON(e) {
        if (!e || !Array.isArray(e.ranges) || typeof e.main != "number" || e.main >= e.ranges.length) throw new RangeError("Invalid JSON representation for EditorSelection");
        return new O(e.ranges.map((t)=>rs.fromJSON(t)), e.main);
    }
    static single(e, t = e) {
        return new O([
            O.range(e, t)
        ], 0);
    }
    static create(e, t = 0) {
        if (e.length == 0) throw new RangeError("A selection needs at least one range");
        for(let n = 0, r = 0; r < e.length; r++){
            let s = e[r];
            if (s.empty ? s.from <= n : s.from < n) return O.normalized(e.slice(), t);
            n = s.to;
        }
        return new O(e, t);
    }
    static cursor(e, t = 0, n, r) {
        return rs.create(e, e, (t == 0 ? 0 : t < 0 ? 8 : 16) | (n == null ? 7 : Math.min(6, n)) | (r ?? 16777215) << 6);
    }
    static range(e, t, n, r) {
        let s = (n ?? 16777215) << 6 | (r == null ? 7 : Math.min(6, r));
        return t < e ? rs.create(t, e, 48 | s) : rs.create(e, t, (t > e ? 8 : 0) | s);
    }
    static normalized(e, t = 0) {
        let n = e[t];
        e.sort((r, s)=>r.from - s.from), t = e.indexOf(n);
        for(let r = 1; r < e.length; r++){
            let s = e[r], o = e[r - 1];
            if (s.empty ? s.from <= o.to : s.from < o.to) {
                let l = o.from, a = Math.max(s.to, o.to);
                r <= t && t--, e.splice(--r, 2, s.anchor > s.head ? O.range(a, l) : O.range(l, a));
            }
        }
        return new O(e, t);
    }
}
function Sd(i, e) {
    for (let t of i.ranges)if (t.to > e) throw new RangeError("Selection points outside of document");
}
let hc = 0;
class q {
    constructor(e, t, n, r, s){
        this.combine = e, this.compareInput = t, this.compare = n, this.isStatic = r, this.id = hc++, this.default = e([]), this.extensions = typeof s == "function" ? s(this) : s;
    }
    get reader() {
        return this;
    }
    static define(e = {}) {
        return new q(e.combine || ((t)=>t), e.compareInput || ((t, n)=>t === n), e.compare || (e.combine ? (t, n)=>t === n : uc), !!e.static, e.enables);
    }
    of(e) {
        return new Os([], this, 0, e);
    }
    compute(e, t) {
        if (this.isStatic) throw new Error("Can't compute a static facet");
        return new Os(e, this, 1, t);
    }
    computeN(e, t) {
        if (this.isStatic) throw new Error("Can't compute a static facet");
        return new Os(e, this, 2, t);
    }
    from(e, t) {
        return t || (t = (n)=>n), this.compute([
            e
        ], (n)=>t(n.field(e)));
    }
}
function uc(i, e) {
    return i == e || i.length == e.length && i.every((t, n)=>t === e[n]);
}
class Os {
    constructor(e, t, n, r){
        this.dependencies = e, this.facet = t, this.type = n, this.value = r, this.id = hc++;
    }
    dynamicSlot(e) {
        var t;
        let n = this.value, r = this.facet.compareInput, s = this.id, o = e[s] >> 1, l = this.type == 2, a = !1, c = !1, h = [];
        for (let u of this.dependencies)u == "doc" ? a = !0 : u == "selection" ? c = !0 : ((t = e[u.id]) !== null && t !== void 0 ? t : 1) & 1 || h.push(e[u.id]);
        return {
            create (u) {
                return u.values[o] = n(u), 1;
            },
            update (u, f) {
                if (a && f.docChanged || c && (f.docChanged || f.selection) || bl(u, h)) {
                    let d = n(u);
                    if (l ? !Jc(d, u.values[o], r) : !r(d, u.values[o])) return u.values[o] = d, 1;
                }
                return 0;
            },
            reconfigure: (u, f)=>{
                let d, p = f.config.address[s];
                if (p != null) {
                    let y = js(f, p);
                    if (this.dependencies.every((b)=>b instanceof q ? f.facet(b) === u.facet(b) : b instanceof pt ? f.field(b, !1) == u.field(b, !1) : !0) || (l ? Jc(d = n(u), y, r) : r(d = n(u), y))) return u.values[o] = y, 0;
                } else d = n(u);
                return u.values[o] = d, 1;
            }
        };
    }
}
function Jc(i, e, t) {
    if (i.length != e.length) return !1;
    for(let n = 0; n < i.length; n++)if (!t(i[n], e[n])) return !1;
    return !0;
}
function bl(i, e) {
    let t = !1;
    for (let n of e)hr(i, n) & 1 && (t = !0);
    return t;
}
function Tm(i, e, t) {
    let n = t.map((a)=>i[a.id]), r = t.map((a)=>a.type), s = n.filter((a)=>!(a & 1)), o = i[e.id] >> 1;
    function l(a) {
        let c = [];
        for(let h = 0; h < n.length; h++){
            let u = js(a, n[h]);
            if (r[h] == 2) for (let f of u)c.push(f);
            else c.push(u);
        }
        return e.combine(c);
    }
    return {
        create (a) {
            for (let c of n)hr(a, c);
            return a.values[o] = l(a), 1;
        },
        update (a, c) {
            if (!bl(a, s)) return 0;
            let h = l(a);
            return e.compare(h, a.values[o]) ? 0 : (a.values[o] = h, 1);
        },
        reconfigure (a, c) {
            let h = bl(a, n), u = c.config.facets[e.id], f = c.facet(e);
            if (u && !h && uc(t, u)) return a.values[o] = f, 0;
            let d = l(a);
            return e.compare(d, f) ? (a.values[o] = f, 0) : (a.values[o] = d, 1);
        }
    };
}
const Qc = q.define({
    static: !0
});
class pt {
    constructor(e, t, n, r, s){
        this.id = e, this.createF = t, this.updateF = n, this.compareF = r, this.spec = s, this.provides = void 0;
    }
    static define(e) {
        let t = new pt(hc++, e.create, e.update, e.compare || ((n, r)=>n === r), e);
        return e.provide && (t.provides = e.provide(t)), t;
    }
    create(e) {
        let t = e.facet(Qc).find((n)=>n.field == this);
        return ((t == null ? void 0 : t.create) || this.createF)(e);
    }
    slot(e) {
        let t = e[this.id] >> 1;
        return {
            create: (n)=>(n.values[t] = this.create(n), 1),
            update: (n, r)=>{
                let s = n.values[t], o = this.updateF(s, r);
                return this.compareF(s, o) ? 0 : (n.values[t] = o, 1);
            },
            reconfigure: (n, r)=>r.config.address[this.id] != null ? (n.values[t] = r.field(this), 0) : (n.values[t] = this.create(n), 1)
        };
    }
    init(e) {
        return [
            this,
            Qc.of({
                field: this,
                create: e
            })
        ];
    }
    get extension() {
        return this;
    }
}
const ji = {
    lowest: 4,
    low: 3,
    default: 2,
    high: 1,
    highest: 0
};
function Jn(i) {
    return (e)=>new Cd(e, i);
}
const Mr = {
    highest: Jn(ji.highest),
    high: Jn(ji.high),
    default: Jn(ji.default),
    low: Jn(ji.low),
    lowest: Jn(ji.lowest)
};
class Cd {
    constructor(e, t){
        this.inner = e, this.prec = t;
    }
}
class wo {
    of(e) {
        return new vl(this, e);
    }
    reconfigure(e) {
        return wo.reconfigure.of({
            compartment: this,
            extension: e
        });
    }
    get(e) {
        return e.config.compartments.get(this);
    }
}
class vl {
    constructor(e, t){
        this.compartment = e, this.inner = t;
    }
}
class qs {
    constructor(e, t, n, r, s, o){
        for(this.base = e, this.compartments = t, this.dynamicSlots = n, this.address = r, this.staticValues = s, this.facets = o, this.statusTemplate = []; this.statusTemplate.length < n.length;)this.statusTemplate.push(0);
    }
    staticFacet(e) {
        let t = this.address[e.id];
        return t == null ? e.default : this.staticValues[t >> 1];
    }
    static resolve(e, t, n) {
        let r = [], s = Object.create(null), o = new Map;
        for (let f of xm(e, t, o))f instanceof pt ? r.push(f) : (s[f.facet.id] || (s[f.facet.id] = [])).push(f);
        let l = Object.create(null), a = [], c = [];
        for (let f of r)l[f.id] = c.length << 1, c.push((d)=>f.slot(d));
        let h = n == null ? void 0 : n.config.facets;
        for(let f in s){
            let d = s[f], p = d[0].facet, y = h && h[f] || [];
            if (d.every((b)=>b.type == 0)) {
                if (l[p.id] = a.length << 1 | 1, uc(y, d)) a.push(n.facet(p));
                else {
                    let b = p.combine(d.map((k)=>k.value));
                    a.push(n && p.compare(b, n.facet(p)) ? n.facet(p) : b);
                }
            } else {
                for (let b of d)b.type == 0 ? (l[b.id] = a.length << 1 | 1, a.push(b.value)) : (l[b.id] = c.length << 1, c.push((k)=>b.dynamicSlot(k)));
                l[p.id] = c.length << 1, c.push((b)=>Tm(b, p, d));
            }
        }
        let u = c.map((f)=>f(l));
        return new qs(e, o, u, l, a, s);
    }
}
function xm(i, e, t) {
    let n = [
        [],
        [],
        [],
        [],
        []
    ], r = new Map;
    function s(o, l) {
        let a = r.get(o);
        if (a != null) {
            if (a <= l) return;
            let c = n[a].indexOf(o);
            c > -1 && n[a].splice(c, 1), o instanceof vl && t.delete(o.compartment);
        }
        if (r.set(o, l), Array.isArray(o)) for (let c of o)s(c, l);
        else if (o instanceof vl) {
            if (t.has(o.compartment)) throw new RangeError("Duplicate use of compartment in extensions");
            let c = e.get(o.compartment) || o.inner;
            t.set(o.compartment, c), s(c, l);
        } else if (o instanceof Cd) s(o.inner, o.prec);
        else if (o instanceof pt) n[l].push(o), o.provides && s(o.provides, l);
        else if (o instanceof Os) n[l].push(o), o.facet.extensions && s(o.facet.extensions, ji.default);
        else {
            let c = o.extension;
            if (!c) throw new Error(`Unrecognized extension value in extension set (${o}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`);
            s(c, l);
        }
    }
    return s(i, ji.default), n.reduce((o, l)=>o.concat(l));
}
function hr(i, e) {
    if (e & 1) return 2;
    let t = e >> 1, n = i.status[t];
    if (n == 4) throw new Error("Cyclic dependency between fields and/or facets");
    if (n & 2) return n;
    i.status[t] = 4;
    let r = i.computeSlot(i, i.config.dynamicSlots[t]);
    return i.status[t] = 2 | r;
}
function js(i, e) {
    return e & 1 ? i.config.staticValues[e >> 1] : i.values[e >> 1];
}
const Td = q.define(), xd = q.define({
    combine: (i)=>i.some((e)=>e),
    static: !0
}), Rd = q.define({
    combine: (i)=>i.length ? i[0] : void 0,
    static: !0
}), Od = q.define(), Dd = q.define(), Pd = q.define(), Md = q.define({
    combine: (i)=>i.length ? i[0] : !1
});
class oi {
    constructor(e, t){
        this.type = e, this.value = t;
    }
    static define() {
        return new Rm;
    }
}
class Rm {
    of(e) {
        return new oi(this, e);
    }
}
class Om {
    constructor(e){
        this.map = e;
    }
    of(e) {
        return new Z(this, e);
    }
}
class Z {
    constructor(e, t){
        this.type = e, this.value = t;
    }
    map(e) {
        let t = this.type.map(this.value, e);
        return t === void 0 ? void 0 : t == this.value ? this : new Z(this.type, t);
    }
    is(e) {
        return this.type == e;
    }
    static define(e = {}) {
        return new Om(e.map || ((t)=>t));
    }
    static mapEffects(e, t) {
        if (!e.length) return e;
        let n = [];
        for (let r of e){
            let s = r.map(t);
            s && n.push(s);
        }
        return n;
    }
}
Z.reconfigure = Z.define();
Z.appendConfig = Z.define();
class Pe {
    constructor(e, t, n, r, s, o){
        this.startState = e, this.changes = t, this.selection = n, this.effects = r, this.annotations = s, this.scrollIntoView = o, this._doc = null, this._state = null, n && Sd(n, t.newLength), s.some((l)=>l.type == Pe.time) || (this.annotations = s.concat(Pe.time.of(Date.now())));
    }
    static create(e, t, n, r, s, o) {
        return new Pe(e, t, n, r, s, o);
    }
    get newDoc() {
        return this._doc || (this._doc = this.changes.apply(this.startState.doc));
    }
    get newSelection() {
        return this.selection || this.startState.selection.map(this.changes);
    }
    get state() {
        return this._state || this.startState.applyTransaction(this), this._state;
    }
    annotation(e) {
        for (let t of this.annotations)if (t.type == e) return t.value;
    }
    get docChanged() {
        return !this.changes.empty;
    }
    get reconfigured() {
        return this.startState.config != this.state.config;
    }
    isUserEvent(e) {
        let t = this.annotation(Pe.userEvent);
        return !!(t && (t == e || t.length > e.length && t.slice(0, e.length) == e && t[e.length] == "."));
    }
}
Pe.time = oi.define();
Pe.userEvent = oi.define();
Pe.addToHistory = oi.define();
Pe.remote = oi.define();
function Dm(i, e) {
    let t = [];
    for(let n = 0, r = 0;;){
        let s, o;
        if (n < i.length && (r == e.length || e[r] >= i[n])) s = i[n++], o = i[n++];
        else if (r < e.length) s = e[r++], o = e[r++];
        else return t;
        !t.length || t[t.length - 1] < s ? t.push(s, o) : t[t.length - 1] < o && (t[t.length - 1] = o);
    }
}
function Ad(i, e, t) {
    var n;
    let r, s, o;
    return t ? (r = e.changes, s = De.empty(e.changes.length), o = i.changes.compose(e.changes)) : (r = e.changes.map(i.changes), s = i.changes.mapDesc(e.changes, !0), o = i.changes.compose(r)), {
        changes: o,
        selection: e.selection ? e.selection.map(s) : (n = i.selection) === null || n === void 0 ? void 0 : n.map(r),
        effects: Z.mapEffects(i.effects, r).concat(Z.mapEffects(e.effects, s)),
        annotations: i.annotations.length ? i.annotations.concat(e.annotations) : e.annotations,
        scrollIntoView: i.scrollIntoView || e.scrollIntoView
    };
}
function wl(i, e, t) {
    let n = e.selection, r = hn(e.annotations);
    return e.userEvent && (r = r.concat(Pe.userEvent.of(e.userEvent))), {
        changes: e.changes instanceof De ? e.changes : De.of(e.changes || [], t, i.facet(Rd)),
        selection: n && (n instanceof O ? n : O.single(n.anchor, n.head)),
        effects: hn(e.effects),
        annotations: r,
        scrollIntoView: !!e.scrollIntoView
    };
}
function _d(i, e, t) {
    let n = wl(i, e.length ? e[0] : {}, i.doc.length);
    e.length && e[0].filter === !1 && (t = !1);
    for(let s = 1; s < e.length; s++){
        e[s].filter === !1 && (t = !1);
        let o = !!e[s].sequential;
        n = Ad(n, wl(i, e[s], o ? n.changes.newLength : i.doc.length), o);
    }
    let r = Pe.create(i, n.changes, n.selection, n.effects, n.annotations, n.scrollIntoView);
    return Mm(t ? Pm(r) : r);
}
function Pm(i) {
    let e = i.startState, t = !0;
    for (let r of e.facet(Od)){
        let s = r(i);
        if (s === !1) {
            t = !1;
            break;
        }
        Array.isArray(s) && (t = t === !0 ? s : Dm(t, s));
    }
    if (t !== !0) {
        let r, s;
        if (t === !1) s = i.changes.invertedDesc, r = De.empty(e.doc.length);
        else {
            let o = i.changes.filter(t);
            r = o.changes, s = o.filtered.mapDesc(o.changes).invertedDesc;
        }
        i = Pe.create(e, r, i.selection && i.selection.map(s), Z.mapEffects(i.effects, s), i.annotations, i.scrollIntoView);
    }
    let n = e.facet(Dd);
    for(let r = n.length - 1; r >= 0; r--){
        let s = n[r](i);
        s instanceof Pe ? i = s : Array.isArray(s) && s.length == 1 && s[0] instanceof Pe ? i = s[0] : i = _d(e, hn(s), !1);
    }
    return i;
}
function Mm(i) {
    let e = i.startState, t = e.facet(Pd), n = i;
    for(let r = t.length - 1; r >= 0; r--){
        let s = t[r](i);
        s && Object.keys(s).length && (n = Ad(n, wl(e, s, i.changes.newLength), !0));
    }
    return n == i ? i : Pe.create(e, i.changes, i.selection, n.effects, n.annotations, n.scrollIntoView);
}
const Am = [];
function hn(i) {
    return i == null ? Am : Array.isArray(i) ? i : [
        i
    ];
}
var ei = function(i) {
    return i[i.Word = 0] = "Word", i[i.Space = 1] = "Space", i[i.Other = 2] = "Other", i;
}(ei || (ei = {}));
const _m = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
let kl;
try {
    kl = new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
} catch  {}
function Em(i) {
    if (kl) return kl.test(i);
    for(let e = 0; e < i.length; e++){
        let t = i[e];
        if (/\w/.test(t) || t > "\x80" && (t.toUpperCase() != t.toLowerCase() || _m.test(t))) return !0;
    }
    return !1;
}
function Nm(i) {
    return (e)=>{
        if (!/\S/.test(e)) return ei.Space;
        if (Em(e)) return ei.Word;
        for(let t = 0; t < i.length; t++)if (e.indexOf(i[t]) > -1) return ei.Word;
        return ei.Other;
    };
}
class ie {
    constructor(e, t, n, r, s, o){
        this.config = e, this.doc = t, this.selection = n, this.values = r, this.status = e.statusTemplate.slice(), this.computeSlot = s, o && (o._state = this);
        for(let l = 0; l < this.config.dynamicSlots.length; l++)hr(this, l << 1);
        this.computeSlot = null;
    }
    field(e, t = !0) {
        let n = this.config.address[e.id];
        if (n == null) {
            if (t) throw new RangeError("Field is not present in this state");
            return;
        }
        return hr(this, n), js(this, n);
    }
    update(...e) {
        return _d(this, e, !0);
    }
    applyTransaction(e) {
        let t = this.config, { base: n, compartments: r } = t;
        for (let o of e.effects)o.is(wo.reconfigure) ? (t && (r = new Map, t.compartments.forEach((l, a)=>r.set(a, l)), t = null), r.set(o.value.compartment, o.value.extension)) : o.is(Z.reconfigure) ? (t = null, n = o.value) : o.is(Z.appendConfig) && (t = null, n = hn(n).concat(o.value));
        let s;
        t ? s = e.startState.values.slice() : (t = qs.resolve(n, r, this), s = new ie(t, this.doc, this.selection, t.dynamicSlots.map(()=>null), (l, a)=>a.reconfigure(l, this), null).values), new ie(t, e.newDoc, e.newSelection, s, (o, l)=>l.update(o, e), e);
    }
    replaceSelection(e) {
        return typeof e == "string" && (e = this.toText(e)), this.changeByRange((t)=>({
                changes: {
                    from: t.from,
                    to: t.to,
                    insert: e
                },
                range: O.cursor(t.from + e.length)
            }));
    }
    changeByRange(e) {
        let t = this.selection, n = e(t.ranges[0]), r = this.changes(n.changes), s = [
            n.range
        ], o = hn(n.effects);
        for(let l = 1; l < t.ranges.length; l++){
            let a = e(t.ranges[l]), c = this.changes(a.changes), h = c.map(r);
            for(let f = 0; f < l; f++)s[f] = s[f].map(h);
            let u = r.mapDesc(c, !0);
            s.push(a.range.map(u)), r = r.compose(h), o = Z.mapEffects(o, h).concat(Z.mapEffects(hn(a.effects), u));
        }
        return {
            changes: r,
            selection: O.create(s, t.mainIndex),
            effects: o
        };
    }
    changes(e = []) {
        return e instanceof De ? e : De.of(e, this.doc.length, this.facet(ie.lineSeparator));
    }
    toText(e) {
        return X.of(e.split(this.facet(ie.lineSeparator) || pl));
    }
    sliceDoc(e = 0, t = this.doc.length) {
        return this.doc.sliceString(e, t, this.lineBreak);
    }
    facet(e) {
        let t = this.config.address[e.id];
        return t == null ? e.default : (hr(this, t), js(this, t));
    }
    toJSON(e) {
        let t = {
            doc: this.sliceDoc(),
            selection: this.selection.toJSON()
        };
        if (e) for(let n in e){
            let r = e[n];
            r instanceof pt && this.config.address[r.id] != null && (t[n] = r.spec.toJSON(this.field(e[n]), this));
        }
        return t;
    }
    static fromJSON(e, t = {}, n) {
        if (!e || typeof e.doc != "string") throw new RangeError("Invalid JSON representation for EditorState");
        let r = [];
        if (n) {
            for(let s in n)if (Object.prototype.hasOwnProperty.call(e, s)) {
                let o = n[s], l = e[s];
                r.push(o.init((a)=>o.spec.fromJSON(l, a)));
            }
        }
        return ie.create({
            doc: e.doc,
            selection: O.fromJSON(e.selection),
            extensions: t.extensions ? r.concat([
                t.extensions
            ]) : r
        });
    }
    static create(e = {}) {
        let t = qs.resolve(e.extensions || [], new Map), n = e.doc instanceof X ? e.doc : X.of((e.doc || "").split(t.staticFacet(ie.lineSeparator) || pl)), r = e.selection ? e.selection instanceof O ? e.selection : O.single(e.selection.anchor, e.selection.head) : O.single(0);
        return Sd(r, n.length), t.staticFacet(xd) || (r = r.asSingle()), new ie(t, n, r, t.dynamicSlots.map(()=>null), (s, o)=>o.create(s), null);
    }
    get tabSize() {
        return this.facet(ie.tabSize);
    }
    get lineBreak() {
        return this.facet(ie.lineSeparator) || `
`;
    }
    get readOnly() {
        return this.facet(Md);
    }
    phrase(e, ...t) {
        for (let n of this.facet(ie.phrases))if (Object.prototype.hasOwnProperty.call(n, e)) {
            e = n[e];
            break;
        }
        return t.length && (e = e.replace(/\$(\$|\d*)/g, (n, r)=>{
            if (r == "$") return "$";
            let s = +(r || 1);
            return !s || s > t.length ? n : t[s - 1];
        })), e;
    }
    languageDataAt(e, t, n = -1) {
        let r = [];
        for (let s of this.facet(Td))for (let o of s(this, t, n))Object.prototype.hasOwnProperty.call(o, e) && r.push(o[e]);
        return r;
    }
    charCategorizer(e) {
        return Nm(this.languageDataAt("wordChars", e).join(""));
    }
    wordAt(e) {
        let { text: t, from: n, length: r } = this.doc.lineAt(e), s = this.charCategorizer(e), o = e - n, l = e - n;
        for(; o > 0;){
            let a = Xe(t, o, !1);
            if (s(t.slice(a, o)) != ei.Word) break;
            o = a;
        }
        for(; l < r;){
            let a = Xe(t, l);
            if (s(t.slice(l, a)) != ei.Word) break;
            l = a;
        }
        return o == l ? null : O.range(o + n, l + n);
    }
}
ie.allowMultipleSelections = xd;
ie.tabSize = q.define({
    combine: (i)=>i.length ? i[0] : 4
});
ie.lineSeparator = Rd;
ie.readOnly = Md;
ie.phrases = q.define({
    compare (i, e) {
        let t = Object.keys(i), n = Object.keys(e);
        return t.length == n.length && t.every((r)=>i[r] == e[r]);
    }
});
ie.languageData = Td;
ie.changeFilter = Od;
ie.transactionFilter = Dd;
ie.transactionExtender = Pd;
wo.reconfigure = Z.define();
function En(i, e, t = {}) {
    let n = {};
    for (let r of i)for (let s of Object.keys(r)){
        let o = r[s], l = n[s];
        if (l === void 0) n[s] = o;
        else if (!(l === o || o === void 0)) {
            if (Object.hasOwnProperty.call(t, s)) n[s] = t[s](l, o);
            else throw new Error("Config merge conflict for field " + s);
        }
    }
    for(let r in e)n[r] === void 0 && (n[r] = e[r]);
    return n;
}
class $i {
    eq(e) {
        return this == e;
    }
    range(e, t = e) {
        return Sl.create(e, t, this);
    }
}
$i.prototype.startSide = $i.prototype.endSide = 0;
$i.prototype.point = !1;
$i.prototype.mapMode = Ye.TrackDel;
let Sl = class Ed {
    constructor(e, t, n){
        this.from = e, this.to = t, this.value = n;
    }
    static create(e, t, n) {
        return new Ed(e, t, n);
    }
};
function Cl(i, e) {
    return i.from - e.from || i.value.startSide - e.value.startSide;
}
class fc {
    constructor(e, t, n, r){
        this.from = e, this.to = t, this.value = n, this.maxPoint = r;
    }
    get length() {
        return this.to[this.to.length - 1];
    }
    findIndex(e, t, n, r = 0) {
        let s = n ? this.to : this.from;
        for(let o = r, l = s.length;;){
            if (o == l) return o;
            let a = o + l >> 1, c = s[a] - e || (n ? this.value[a].endSide : this.value[a].startSide) - t;
            if (a == o) return c >= 0 ? o : l;
            c >= 0 ? l = a : o = a + 1;
        }
    }
    between(e, t, n, r) {
        for(let s = this.findIndex(t, -1000000000, !0), o = this.findIndex(n, 1e9, !1, s); s < o; s++)if (r(this.from[s] + e, this.to[s] + e, this.value[s]) === !1) return !1;
    }
    map(e, t) {
        let n = [], r = [], s = [], o = -1, l = -1;
        for(let a = 0; a < this.value.length; a++){
            let c = this.value[a], h = this.from[a] + e, u = this.to[a] + e, f, d;
            if (h == u) {
                let p = t.mapPos(h, c.startSide, c.mapMode);
                if (p == null || (f = d = p, c.startSide != c.endSide && (d = t.mapPos(h, c.endSide), d < f))) continue;
            } else if (f = t.mapPos(h, c.startSide), d = t.mapPos(u, c.endSide), f > d || f == d && c.startSide > 0 && c.endSide <= 0) continue;
            (d - f || c.endSide - c.startSide) < 0 || (o < 0 && (o = f), c.point && (l = Math.max(l, d - f)), n.push(c), r.push(f - o), s.push(d - o));
        }
        return {
            mapped: n.length ? new fc(r, s, n, l) : null,
            pos: o
        };
    }
}
class le {
    constructor(e, t, n, r){
        this.chunkPos = e, this.chunk = t, this.nextLayer = n, this.maxPoint = r;
    }
    static create(e, t, n, r) {
        return new le(e, t, n, r);
    }
    get length() {
        let e = this.chunk.length - 1;
        return e < 0 ? 0 : Math.max(this.chunkEnd(e), this.nextLayer.length);
    }
    get size() {
        if (this.isEmpty) return 0;
        let e = this.nextLayer.size;
        for (let t of this.chunk)e += t.value.length;
        return e;
    }
    chunkEnd(e) {
        return this.chunkPos[e] + this.chunk[e].length;
    }
    update(e) {
        let { add: t = [], sort: n = !1, filterFrom: r = 0, filterTo: s = this.length } = e, o = e.filter;
        if (t.length == 0 && !o) return this;
        if (n && (t = t.slice().sort(Cl)), this.isEmpty) return t.length ? le.of(t) : this;
        let l = new Nd(this, null, -1).goto(0), a = 0, c = [], h = new zi;
        for(; l.value || a < t.length;)if (a < t.length && (l.from - t[a].from || l.startSide - t[a].value.startSide) >= 0) {
            let u = t[a++];
            h.addInner(u.from, u.to, u.value) || c.push(u);
        } else l.rangeIndex == 1 && l.chunkIndex < this.chunk.length && (a == t.length || this.chunkEnd(l.chunkIndex) < t[a].from) && (!o || r > this.chunkEnd(l.chunkIndex) || s < this.chunkPos[l.chunkIndex]) && h.addChunk(this.chunkPos[l.chunkIndex], this.chunk[l.chunkIndex]) ? l.nextChunk() : ((!o || r > l.to || s < l.from || o(l.from, l.to, l.value)) && (h.addInner(l.from, l.to, l.value) || c.push(Sl.create(l.from, l.to, l.value))), l.next());
        return h.finishInner(this.nextLayer.isEmpty && !c.length ? le.empty : this.nextLayer.update({
            add: c,
            filter: o,
            filterFrom: r,
            filterTo: s
        }));
    }
    map(e) {
        if (e.empty || this.isEmpty) return this;
        let t = [], n = [], r = -1;
        for(let o = 0; o < this.chunk.length; o++){
            let l = this.chunkPos[o], a = this.chunk[o], c = e.touchesRange(l, l + a.length);
            if (c === !1) r = Math.max(r, a.maxPoint), t.push(a), n.push(e.mapPos(l));
            else if (c === !0) {
                let { mapped: h, pos: u } = a.map(l, e);
                h && (r = Math.max(r, h.maxPoint), t.push(h), n.push(u));
            }
        }
        let s = this.nextLayer.map(e);
        return t.length == 0 ? s : new le(n, t, s || le.empty, r);
    }
    between(e, t, n) {
        if (!this.isEmpty) {
            for(let r = 0; r < this.chunk.length; r++){
                let s = this.chunkPos[r], o = this.chunk[r];
                if (t >= s && e <= s + o.length && o.between(s, e - s, t - s, n) === !1) return;
            }
            this.nextLayer.between(e, t, n);
        }
    }
    iter(e = 0) {
        return dr.from([
            this
        ]).goto(e);
    }
    get isEmpty() {
        return this.nextLayer == this;
    }
    static iter(e, t = 0) {
        return dr.from(e).goto(t);
    }
    static compare(e, t, n, r, s = -1) {
        let o = e.filter((u)=>u.maxPoint > 0 || !u.isEmpty && u.maxPoint >= s), l = t.filter((u)=>u.maxPoint > 0 || !u.isEmpty && u.maxPoint >= s), a = Yc(o, l, n), c = new Qn(o, a, s), h = new Qn(l, a, s);
        n.iterGaps((u, f, d)=>Xc(c, u, h, f, d, r)), n.empty && n.length == 0 && Xc(c, 0, h, 0, 0, r);
    }
    static eq(e, t, n = 0, r) {
        r == null && (r = 1e9 - 1);
        let s = e.filter((h)=>!h.isEmpty && t.indexOf(h) < 0), o = t.filter((h)=>!h.isEmpty && e.indexOf(h) < 0);
        if (s.length != o.length) return !1;
        if (!s.length) return !0;
        let l = Yc(s, o), a = new Qn(s, l, 0).goto(n), c = new Qn(o, l, 0).goto(n);
        for(;;){
            if (a.to != c.to || !Tl(a.active, c.active) || a.point && (!c.point || !a.point.eq(c.point))) return !1;
            if (a.to > r) return !0;
            a.next(), c.next();
        }
    }
    static spans(e, t, n, r, s = -1) {
        let o = new Qn(e, null, s).goto(t), l = t, a = o.openStart;
        for(;;){
            let c = Math.min(o.to, n);
            if (o.point) {
                let h = o.activeForPoint(o.to), u = o.pointFrom < t ? h.length + 1 : Math.min(h.length, a);
                r.point(l, c, o.point, h, u, o.pointRank), a = Math.min(o.openEnd(c), h.length);
            } else c > l && (r.span(l, c, o.active, a), a = o.openEnd(c));
            if (o.to > n) return a + (o.point && o.to > n ? 1 : 0);
            l = o.to, o.next();
        }
    }
    static of(e, t = !1) {
        let n = new zi;
        for (let r of e instanceof Sl ? [
            e
        ] : t ? Lm(e) : e)n.add(r.from, r.to, r.value);
        return n.finish();
    }
}
le.empty = new le([], [], null, -1);
function Lm(i) {
    if (i.length > 1) for(let e = i[0], t = 1; t < i.length; t++){
        let n = i[t];
        if (Cl(e, n) > 0) return i.slice().sort(Cl);
        e = n;
    }
    return i;
}
le.empty.nextLayer = le.empty;
class zi {
    finishChunk(e) {
        this.chunks.push(new fc(this.from, this.to, this.value, this.maxPoint)), this.chunkPos.push(this.chunkStart), this.chunkStart = -1, this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint), this.maxPoint = -1, e && (this.from = [], this.to = [], this.value = []);
    }
    constructor(){
        this.chunks = [], this.chunkPos = [], this.chunkStart = -1, this.last = null, this.lastFrom = -1000000000, this.lastTo = -1000000000, this.from = [], this.to = [], this.value = [], this.maxPoint = -1, this.setMaxPoint = -1, this.nextLayer = null;
    }
    add(e, t, n) {
        this.addInner(e, t, n) || (this.nextLayer || (this.nextLayer = new zi)).add(e, t, n);
    }
    addInner(e, t, n) {
        let r = e - this.lastTo || n.startSide - this.last.endSide;
        if (r <= 0 && (e - this.lastFrom || n.startSide - this.last.startSide) < 0) throw new Error("Ranges must be added sorted by `from` position and `startSide`");
        return r < 0 ? !1 : (this.from.length == 250 && this.finishChunk(!0), this.chunkStart < 0 && (this.chunkStart = e), this.from.push(e - this.chunkStart), this.to.push(t - this.chunkStart), this.last = n, this.lastFrom = e, this.lastTo = t, this.value.push(n), n.point && (this.maxPoint = Math.max(this.maxPoint, t - e)), !0);
    }
    addChunk(e, t) {
        if ((e - this.lastTo || t.value[0].startSide - this.last.endSide) < 0) return !1;
        this.from.length && this.finishChunk(!0), this.setMaxPoint = Math.max(this.setMaxPoint, t.maxPoint), this.chunks.push(t), this.chunkPos.push(e);
        let n = t.value.length - 1;
        return this.last = t.value[n], this.lastFrom = t.from[n] + e, this.lastTo = t.to[n] + e, !0;
    }
    finish() {
        return this.finishInner(le.empty);
    }
    finishInner(e) {
        if (this.from.length && this.finishChunk(!1), this.chunks.length == 0) return e;
        let t = le.create(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(e) : e, this.setMaxPoint);
        return this.from = null, t;
    }
}
function Yc(i, e, t) {
    let n = new Map;
    for (let s of i)for(let o = 0; o < s.chunk.length; o++)s.chunk[o].maxPoint <= 0 && n.set(s.chunk[o], s.chunkPos[o]);
    let r = new Set;
    for (let s of e)for(let o = 0; o < s.chunk.length; o++){
        let l = n.get(s.chunk[o]);
        l != null && (t ? t.mapPos(l) : l) == s.chunkPos[o] && !(t != null && t.touchesRange(l, l + s.chunk[o].length)) && r.add(s.chunk[o]);
    }
    return r;
}
class Nd {
    constructor(e, t, n, r = 0){
        this.layer = e, this.skip = t, this.minPoint = n, this.rank = r;
    }
    get startSide() {
        return this.value ? this.value.startSide : 0;
    }
    get endSide() {
        return this.value ? this.value.endSide : 0;
    }
    goto(e, t = -1000000000) {
        return this.chunkIndex = this.rangeIndex = 0, this.gotoInner(e, t, !1), this;
    }
    gotoInner(e, t, n) {
        for(; this.chunkIndex < this.layer.chunk.length;){
            let r = this.layer.chunk[this.chunkIndex];
            if (!(this.skip && this.skip.has(r) || this.layer.chunkEnd(this.chunkIndex) < e || r.maxPoint < this.minPoint)) break;
            this.chunkIndex++, n = !1;
        }
        if (this.chunkIndex < this.layer.chunk.length) {
            let r = this.layer.chunk[this.chunkIndex].findIndex(e - this.layer.chunkPos[this.chunkIndex], t, !0);
            (!n || this.rangeIndex < r) && this.setRangeIndex(r);
        }
        this.next();
    }
    forward(e, t) {
        (this.to - e || this.endSide - t) < 0 && this.gotoInner(e, t, !0);
    }
    next() {
        for(;;)if (this.chunkIndex == this.layer.chunk.length) {
            this.from = this.to = 1e9, this.value = null;
            break;
        } else {
            let e = this.layer.chunkPos[this.chunkIndex], t = this.layer.chunk[this.chunkIndex], n = e + t.from[this.rangeIndex];
            if (this.from = n, this.to = e + t.to[this.rangeIndex], this.value = t.value[this.rangeIndex], this.setRangeIndex(this.rangeIndex + 1), this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint) break;
        }
    }
    setRangeIndex(e) {
        if (e == this.layer.chunk[this.chunkIndex].value.length) {
            if (this.chunkIndex++, this.skip) for(; this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex]);)this.chunkIndex++;
            this.rangeIndex = 0;
        } else this.rangeIndex = e;
    }
    nextChunk() {
        this.chunkIndex++, this.rangeIndex = 0, this.next();
    }
    compare(e) {
        return this.from - e.from || this.startSide - e.startSide || this.rank - e.rank || this.to - e.to || this.endSide - e.endSide;
    }
}
class dr {
    constructor(e){
        this.heap = e;
    }
    static from(e, t = null, n = -1) {
        let r = [];
        for(let s = 0; s < e.length; s++)for(let o = e[s]; !o.isEmpty; o = o.nextLayer)o.maxPoint >= n && r.push(new Nd(o, t, n, s));
        return r.length == 1 ? r[0] : new dr(r);
    }
    get startSide() {
        return this.value ? this.value.startSide : 0;
    }
    goto(e, t = -1000000000) {
        for (let n of this.heap)n.goto(e, t);
        for(let n = this.heap.length >> 1; n >= 0; n--)Wo(this.heap, n);
        return this.next(), this;
    }
    forward(e, t) {
        for (let n of this.heap)n.forward(e, t);
        for(let n = this.heap.length >> 1; n >= 0; n--)Wo(this.heap, n);
        (this.to - e || this.value.endSide - t) < 0 && this.next();
    }
    next() {
        if (this.heap.length == 0) this.from = this.to = 1e9, this.value = null, this.rank = -1;
        else {
            let e = this.heap[0];
            this.from = e.from, this.to = e.to, this.value = e.value, this.rank = e.rank, e.value && e.next(), Wo(this.heap, 0);
        }
    }
}
function Wo(i, e) {
    for(let t = i[e];;){
        let n = (e << 1) + 1;
        if (n >= i.length) break;
        let r = i[n];
        if (n + 1 < i.length && r.compare(i[n + 1]) >= 0 && (r = i[n + 1], n++), t.compare(r) < 0) break;
        i[n] = t, i[e] = r, e = n;
    }
}
class Qn {
    constructor(e, t, n){
        this.minPoint = n, this.active = [], this.activeTo = [], this.activeRank = [], this.minActive = -1, this.point = null, this.pointFrom = 0, this.pointRank = 0, this.to = -1000000000, this.endSide = 0, this.openStart = -1, this.cursor = dr.from(e, t, n);
    }
    goto(e, t = -1000000000) {
        return this.cursor.goto(e, t), this.active.length = this.activeTo.length = this.activeRank.length = 0, this.minActive = -1, this.to = e, this.endSide = t, this.openStart = -1, this.next(), this;
    }
    forward(e, t) {
        for(; this.minActive > -1 && (this.activeTo[this.minActive] - e || this.active[this.minActive].endSide - t) < 0;)this.removeActive(this.minActive);
        this.cursor.forward(e, t);
    }
    removeActive(e) {
        ss(this.active, e), ss(this.activeTo, e), ss(this.activeRank, e), this.minActive = Zc(this.active, this.activeTo);
    }
    addActive(e) {
        let t = 0, { value: n, to: r, rank: s } = this.cursor;
        for(; t < this.activeRank.length && this.activeRank[t] <= s;)t++;
        os(this.active, t, n), os(this.activeTo, t, r), os(this.activeRank, t, s), e && os(e, t, this.cursor.from), this.minActive = Zc(this.active, this.activeTo);
    }
    next() {
        let e = this.to, t = this.point;
        this.point = null;
        let n = this.openStart < 0 ? [] : null;
        for(;;){
            let r = this.minActive;
            if (r > -1 && (this.activeTo[r] - this.cursor.from || this.active[r].endSide - this.cursor.startSide) < 0) {
                if (this.activeTo[r] > e) {
                    this.to = this.activeTo[r], this.endSide = this.active[r].endSide;
                    break;
                }
                this.removeActive(r), n && ss(n, r);
            } else if (this.cursor.value) {
                if (this.cursor.from > e) {
                    this.to = this.cursor.from, this.endSide = this.cursor.startSide;
                    break;
                } else {
                    let s = this.cursor.value;
                    if (!s.point) this.addActive(n), this.cursor.next();
                    else if (t && this.cursor.to == this.to && this.cursor.from < this.cursor.to) this.cursor.next();
                    else {
                        this.point = s, this.pointFrom = this.cursor.from, this.pointRank = this.cursor.rank, this.to = this.cursor.to, this.endSide = s.endSide, this.cursor.next(), this.forward(this.to, this.endSide);
                        break;
                    }
                }
            } else {
                this.to = this.endSide = 1e9;
                break;
            }
        }
        if (n) {
            this.openStart = 0;
            for(let r = n.length - 1; r >= 0 && n[r] < e; r--)this.openStart++;
        }
    }
    activeForPoint(e) {
        if (!this.active.length) return this.active;
        let t = [];
        for(let n = this.active.length - 1; n >= 0 && !(this.activeRank[n] < this.pointRank); n--)(this.activeTo[n] > e || this.activeTo[n] == e && this.active[n].endSide >= this.point.endSide) && t.push(this.active[n]);
        return t.reverse();
    }
    openEnd(e) {
        let t = 0;
        for(let n = this.activeTo.length - 1; n >= 0 && this.activeTo[n] > e; n--)t++;
        return t;
    }
}
function Xc(i, e, t, n, r, s) {
    i.goto(e), t.goto(n);
    let o = n + r, l = n, a = n - e;
    for(;;){
        let c = i.to + a - t.to || i.endSide - t.endSide, h = c < 0 ? i.to + a : t.to, u = Math.min(h, o);
        if (i.point || t.point ? i.point && t.point && (i.point == t.point || i.point.eq(t.point)) && Tl(i.activeForPoint(i.to), t.activeForPoint(t.to)) || s.comparePoint(l, u, i.point, t.point) : u > l && !Tl(i.active, t.active) && s.compareRange(l, u, i.active, t.active), h > o) break;
        l = h, c <= 0 && i.next(), c >= 0 && t.next();
    }
}
function Tl(i, e) {
    if (i.length != e.length) return !1;
    for(let t = 0; t < i.length; t++)if (i[t] != e[t] && !i[t].eq(e[t])) return !1;
    return !0;
}
function ss(i, e) {
    for(let t = e, n = i.length - 1; t < n; t++)i[t] = i[t + 1];
    i.pop();
}
function os(i, e, t) {
    for(let n = i.length - 1; n >= e; n--)i[n + 1] = i[n];
    i[e] = t;
}
function Zc(i, e) {
    let t = -1, n = 1e9;
    for(let r = 0; r < e.length; r++)(e[r] - n || i[r].endSide - i[t].endSide) < 0 && (t = r, n = e[r]);
    return t;
}
function Ar(i, e, t = i.length) {
    let n = 0;
    for(let r = 0; r < t;)i.charCodeAt(r) == 9 ? (n += e - n % e, r++) : (n++, r = Xe(i, r));
    return n;
}
function Bm(i, e, t, n) {
    for(let r = 0, s = 0;;){
        if (s >= e) return r;
        if (r == i.length) break;
        s += i.charCodeAt(r) == 9 ? t - s % t : 1, r = Xe(i, r);
    }
    return n === !0 ? -1 : i.length;
}
const xl = "\u037C", eh = typeof Symbol > "u" ? "__" + xl : Symbol.for(xl), Rl = typeof Symbol > "u" ? "__styleSet" + Math.floor(Math.random() * 1e8) : Symbol("styleSet"), th = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
class xi {
    constructor(e, t){
        this.rules = [];
        let { finish: n } = t || {};
        function r(o) {
            return /^@/.test(o) ? [
                o
            ] : o.split(/,\s*/);
        }
        function s(o, l, a, c) {
            let h = [], u = /^@(\w+)\b/.exec(o[0]), f = u && u[1] == "keyframes";
            if (u && l == null) return a.push(o[0] + ";");
            for(let d in l){
                let p = l[d];
                if (/&/.test(d)) s(d.split(/,\s*/).map((y)=>o.map((b)=>y.replace(/&/, b))).reduce((y, b)=>y.concat(b)), p, a);
                else if (p && typeof p == "object") {
                    if (!u) throw new RangeError("The value of a property (" + d + ") should be a primitive value.");
                    s(r(d), p, h, f);
                } else p != null && h.push(d.replace(/_.*/, "").replace(/[A-Z]/g, (y)=>"-" + y.toLowerCase()) + ": " + p + ";");
            }
            (h.length || f) && a.push((n && !u && !c ? o.map(n) : o).join(", ") + " {" + h.join(" ") + "}");
        }
        for(let o in e)s(r(o), e[o], this.rules);
    }
    getRules() {
        return this.rules.join(`
`);
    }
    static newName() {
        let e = th[eh] || 1;
        return th[eh] = e + 1, xl + e.toString(36);
    }
    static mount(e, t, n) {
        let r = e[Rl], s = n && n.nonce;
        r ? s && r.setNonce(s) : r = new Im(e, s), r.mount(Array.isArray(t) ? t : [
            t
        ]);
    }
}
let ih = new Map;
class Im {
    constructor(e, t){
        let n = e.ownerDocument || e, r = n.defaultView;
        if (!e.head && e.adoptedStyleSheets && r.CSSStyleSheet) {
            let s = ih.get(n);
            if (s) return e.adoptedStyleSheets = [
                s.sheet,
                ...e.adoptedStyleSheets
            ], e[Rl] = s;
            this.sheet = new r.CSSStyleSheet, e.adoptedStyleSheets = [
                this.sheet,
                ...e.adoptedStyleSheets
            ], ih.set(n, this);
        } else {
            this.styleTag = n.createElement("style"), t && this.styleTag.setAttribute("nonce", t);
            let s = e.head || e;
            s.insertBefore(this.styleTag, s.firstChild);
        }
        this.modules = [], e[Rl] = this;
    }
    mount(e) {
        let t = this.sheet, n = 0, r = 0;
        for(let s = 0; s < e.length; s++){
            let o = e[s], l = this.modules.indexOf(o);
            if (l < r && l > -1 && (this.modules.splice(l, 1), r--, l = -1), l == -1) {
                if (this.modules.splice(r++, 0, o), t) for(let a = 0; a < o.rules.length; a++)t.insertRule(o.rules[a], n++);
            } else {
                for(; r < l;)n += this.modules[r++].rules.length;
                n += o.rules.length, r++;
            }
        }
        if (!t) {
            let s = "";
            for(let o = 0; o < this.modules.length; o++)s += this.modules[o].getRules() + `
`;
            this.styleTag.textContent = s;
        }
    }
    setNonce(e) {
        this.styleTag && this.styleTag.getAttribute("nonce") != e && this.styleTag.setAttribute("nonce", e);
    }
}
var Ri = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'"
}, pr = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ":",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: '"'
}, qm = typeof navigator < "u" && /Mac/.test(navigator.platform), jm = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for(var Ne = 0; Ne < 10; Ne++)Ri[48 + Ne] = Ri[96 + Ne] = String(Ne);
for(var Ne = 1; Ne <= 24; Ne++)Ri[Ne + 111] = "F" + Ne;
for(var Ne = 65; Ne <= 90; Ne++)Ri[Ne] = String.fromCharCode(Ne + 32), pr[Ne] = String.fromCharCode(Ne);
for(var Vo in Ri)pr.hasOwnProperty(Vo) || (pr[Vo] = Ri[Vo]);
function Fm(i) {
    var e = qm && i.metaKey && i.shiftKey && !i.ctrlKey && !i.altKey || jm && i.shiftKey && i.key && i.key.length == 1 || i.key == "Unidentified", t = !e && i.key || (i.shiftKey ? pr : Ri)[i.keyCode] || i.key || "Unidentified";
    return t == "Esc" && (t = "Escape"), t == "Del" && (t = "Delete"), t == "Left" && (t = "ArrowLeft"), t == "Up" && (t = "ArrowUp"), t == "Right" && (t = "ArrowRight"), t == "Down" && (t = "ArrowDown"), t;
}
function Fs(i) {
    let e;
    return i.nodeType == 11 ? e = i.getSelection ? i : i.ownerDocument : e = i, e.getSelection();
}
function Ol(i, e) {
    return e ? i == e || i.contains(e.nodeType != 1 ? e.parentNode : e) : !1;
}
function Hm(i) {
    let e = i.activeElement;
    for(; e && e.shadowRoot;)e = e.shadowRoot.activeElement;
    return e;
}
function Ds(i, e) {
    if (!e.anchorNode) return !1;
    try {
        return Ol(i, e.anchorNode);
    } catch  {
        return !1;
    }
}
function gn(i) {
    return i.nodeType == 3 ? Ui(i, 0, i.nodeValue.length).getClientRects() : i.nodeType == 1 ? i.getClientRects() : [];
}
function Hs(i, e, t, n) {
    return t ? nh(i, e, t, n, -1) || nh(i, e, t, n, 1) : !1;
}
function gr(i) {
    for(var e = 0;; e++)if (i = i.previousSibling, !i) return e;
}
function nh(i, e, t, n, r) {
    for(;;){
        if (i == t && e == n) return !0;
        if (e == (r < 0 ? 0 : ii(i))) {
            if (i.nodeName == "DIV") return !1;
            let s = i.parentNode;
            if (!s || s.nodeType != 1) return !1;
            e = gr(i) + (r < 0 ? 0 : 1), i = s;
        } else if (i.nodeType == 1) {
            if (i = i.childNodes[e + (r < 0 ? -1 : 0)], i.nodeType == 1 && i.contentEditable == "false") return !1;
            e = r < 0 ? ii(i) : 0;
        } else return !1;
    }
}
function ii(i) {
    return i.nodeType == 3 ? i.nodeValue.length : i.childNodes.length;
}
function ko(i, e) {
    let t = e ? i.left : i.right;
    return {
        left: t,
        right: t,
        top: i.top,
        bottom: i.bottom
    };
}
function Wm(i) {
    return {
        left: 0,
        right: i.innerWidth,
        top: 0,
        bottom: i.innerHeight
    };
}
function Vm(i, e, t, n, r, s, o, l) {
    let a = i.ownerDocument, c = a.defaultView || window;
    for(let h = i, u = !1; h && !u;)if (h.nodeType == 1) {
        let f, d = h == a.body, p = 1, y = 1;
        if (d) f = Wm(c);
        else {
            if (/^(fixed|sticky)$/.test(getComputedStyle(h).position) && (u = !0), h.scrollHeight <= h.clientHeight && h.scrollWidth <= h.clientWidth) {
                h = h.assignedSlot || h.parentNode;
                continue;
            }
            let T = h.getBoundingClientRect();
            p = T.width / h.offsetWidth, y = T.height / h.offsetHeight, f = {
                left: T.left,
                right: T.left + h.clientWidth * p,
                top: T.top,
                bottom: T.top + h.clientHeight * y
            };
        }
        let b = 0, k = 0;
        if (r == "nearest") e.top < f.top ? (k = -(f.top - e.top + o), t > 0 && e.bottom > f.bottom + k && (k = e.bottom - f.bottom + k + o)) : e.bottom > f.bottom && (k = e.bottom - f.bottom + o, t < 0 && e.top - k < f.top && (k = -(f.top + k - e.top + o)));
        else {
            let T = e.bottom - e.top, D = f.bottom - f.top;
            k = (r == "center" && T <= D ? e.top + T / 2 - D / 2 : r == "start" || r == "center" && t < 0 ? e.top - o : e.bottom - D + o) - f.top;
        }
        if (n == "nearest" ? e.left < f.left ? (b = -(f.left - e.left + s), t > 0 && e.right > f.right + b && (b = e.right - f.right + b + s)) : e.right > f.right && (b = e.right - f.right + s, t < 0 && e.left < f.left + b && (b = -(f.left + b - e.left + s))) : b = (n == "center" ? e.left + (e.right - e.left) / 2 - (f.right - f.left) / 2 : n == "start" == l ? e.left - s : e.right - (f.right - f.left) + s) - f.left, b || k) {
            if (d) c.scrollBy(b, k);
            else {
                let T = 0, D = 0;
                if (k) {
                    let S = h.scrollTop;
                    h.scrollTop += k / y, D = (h.scrollTop - S) * y;
                }
                if (b) {
                    let S = h.scrollLeft;
                    h.scrollLeft += b / p, T = (h.scrollLeft - S) * p;
                }
                e = {
                    left: e.left - T,
                    top: e.top - D,
                    right: e.right - T,
                    bottom: e.bottom - D
                }, T && Math.abs(T - b) < 1 && (n = "nearest"), D && Math.abs(D - k) < 1 && (r = "nearest");
            }
        }
        if (d) break;
        h = h.assignedSlot || h.parentNode;
    } else if (h.nodeType == 11) h = h.host;
    else break;
}
function $m(i) {
    let e = i.ownerDocument;
    for(let t = i.parentNode; t && t != e.body;)if (t.nodeType == 1) {
        if (t.scrollHeight > t.clientHeight || t.scrollWidth > t.clientWidth) return t;
        t = t.assignedSlot || t.parentNode;
    } else if (t.nodeType == 11) t = t.host;
    else break;
    return null;
}
class zm {
    constructor(){
        this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0;
    }
    eq(e) {
        return this.anchorNode == e.anchorNode && this.anchorOffset == e.anchorOffset && this.focusNode == e.focusNode && this.focusOffset == e.focusOffset;
    }
    setRange(e) {
        let { anchorNode: t, focusNode: n } = e;
        this.set(t, Math.min(e.anchorOffset, t ? ii(t) : 0), n, Math.min(e.focusOffset, n ? ii(n) : 0));
    }
    set(e, t, n, r) {
        this.anchorNode = e, this.anchorOffset = t, this.focusNode = n, this.focusOffset = r;
    }
}
let nn = null;
function Ld(i) {
    if (i.setActive) return i.setActive();
    if (nn) return i.focus(nn);
    let e = [];
    for(let t = i; t && (e.push(t, t.scrollTop, t.scrollLeft), t != t.ownerDocument); t = t.parentNode);
    if (i.focus(nn == null ? {
        get preventScroll () {
            return nn = {
                preventScroll: !0
            }, !0;
        }
    } : void 0), !nn) {
        nn = !1;
        for(let t = 0; t < e.length;){
            let n = e[t++], r = e[t++], s = e[t++];
            n.scrollTop != r && (n.scrollTop = r), n.scrollLeft != s && (n.scrollLeft = s);
        }
    }
}
let rh;
function Ui(i, e, t = e) {
    let n = rh || (rh = document.createRange());
    return n.setEnd(i, t), n.setStart(i, e), n;
}
function un(i, e, t) {
    let n = {
        key: e,
        code: e,
        keyCode: t,
        which: t,
        cancelable: !0
    }, r = new KeyboardEvent("keydown", n);
    r.synthetic = !0, i.dispatchEvent(r);
    let s = new KeyboardEvent("keyup", n);
    return s.synthetic = !0, i.dispatchEvent(s), r.defaultPrevented || s.defaultPrevented;
}
function Um(i) {
    for(; i;){
        if (i && (i.nodeType == 9 || i.nodeType == 11 && i.host)) return i;
        i = i.assignedSlot || i.parentNode;
    }
    return null;
}
function Bd(i) {
    for(; i.attributes.length;)i.removeAttributeNode(i.attributes[0]);
}
function Km(i, e) {
    let t = e.focusNode, n = e.focusOffset;
    if (!t || e.anchorNode != t || e.anchorOffset != n) return !1;
    for(n = Math.min(n, ii(t));;)if (n) {
        if (t.nodeType != 1) return !1;
        let r = t.childNodes[n - 1];
        r.contentEditable == "false" ? n-- : (t = r, n = ii(t));
    } else {
        if (t == i) return !0;
        n = gr(t), t = t.parentNode;
    }
}
function Id(i) {
    return i.scrollTop > Math.max(1, i.scrollHeight - i.clientHeight - 4);
}
class He {
    constructor(e, t, n = !0){
        this.node = e, this.offset = t, this.precise = n;
    }
    static before(e, t) {
        return new He(e.parentNode, gr(e), t);
    }
    static after(e, t) {
        return new He(e.parentNode, gr(e) + 1, t);
    }
}
const dc = [];
class fe {
    constructor(){
        this.parent = null, this.dom = null, this.flags = 2;
    }
    get overrideDOMText() {
        return null;
    }
    get posAtStart() {
        return this.parent ? this.parent.posBefore(this) : 0;
    }
    get posAtEnd() {
        return this.posAtStart + this.length;
    }
    posBefore(e) {
        let t = this.posAtStart;
        for (let n of this.children){
            if (n == e) return t;
            t += n.length + n.breakAfter;
        }
        throw new RangeError("Invalid child in posBefore");
    }
    posAfter(e) {
        return this.posBefore(e) + e.length;
    }
    sync(e, t) {
        if (this.flags & 2) {
            let n = this.dom, r = null, s;
            for (let o of this.children){
                if (o.flags & 7) {
                    if (!o.dom && (s = r ? r.nextSibling : n.firstChild)) {
                        let l = fe.get(s);
                        (!l || !l.parent && l.canReuseDOM(o)) && o.reuseDOM(s);
                    }
                    o.sync(e, t), o.flags &= -8;
                }
                if (s = r ? r.nextSibling : n.firstChild, t && !t.written && t.node == n && s != o.dom && (t.written = !0), o.dom.parentNode == n) for(; s && s != o.dom;)s = sh(s);
                else n.insertBefore(o.dom, s);
                r = o.dom;
            }
            for(s = r ? r.nextSibling : n.firstChild, s && t && t.node == n && (t.written = !0); s;)s = sh(s);
        } else if (this.flags & 1) for (let n of this.children)n.flags & 7 && (n.sync(e, t), n.flags &= -8);
    }
    reuseDOM(e) {}
    localPosFromDOM(e, t) {
        let n;
        if (e == this.dom) n = this.dom.childNodes[t];
        else {
            let r = ii(e) == 0 ? 0 : t == 0 ? -1 : 1;
            for(;;){
                let s = e.parentNode;
                if (s == this.dom) break;
                r == 0 && s.firstChild != s.lastChild && (e == s.firstChild ? r = -1 : r = 1), e = s;
            }
            r < 0 ? n = e : n = e.nextSibling;
        }
        if (n == this.dom.firstChild) return 0;
        for(; n && !fe.get(n);)n = n.nextSibling;
        if (!n) return this.length;
        for(let r = 0, s = 0;; r++){
            let o = this.children[r];
            if (o.dom == n) return s;
            s += o.length + o.breakAfter;
        }
    }
    domBoundsAround(e, t, n = 0) {
        let r = -1, s = -1, o = -1, l = -1;
        for(let a = 0, c = n, h = n; a < this.children.length; a++){
            let u = this.children[a], f = c + u.length;
            if (c < e && f > t) return u.domBoundsAround(e, t, c);
            if (f >= e && r == -1 && (r = a, s = c), c > t && u.dom.parentNode == this.dom) {
                o = a, l = h;
                break;
            }
            h = f, c = f + u.breakAfter;
        }
        return {
            from: s,
            to: l < 0 ? n + this.length : l,
            startDOM: (r ? this.children[r - 1].dom.nextSibling : null) || this.dom.firstChild,
            endDOM: o < this.children.length && o >= 0 ? this.children[o].dom : null
        };
    }
    markDirty(e = !1) {
        this.flags |= 2, this.markParentsDirty(e);
    }
    markParentsDirty(e) {
        for(let t = this.parent; t; t = t.parent){
            if (e && (t.flags |= 2), t.flags & 1) return;
            t.flags |= 1, e = !1;
        }
    }
    setParent(e) {
        this.parent != e && (this.parent = e, this.flags & 7 && this.markParentsDirty(!0));
    }
    setDOM(e) {
        this.dom != e && (this.dom && (this.dom.cmView = null), this.dom = e, e.cmView = this);
    }
    get rootView() {
        for(let e = this;;){
            let t = e.parent;
            if (!t) return e;
            e = t;
        }
    }
    replaceChildren(e, t, n = dc) {
        this.markDirty();
        for(let r = e; r < t; r++){
            let s = this.children[r];
            s.parent == this && s.destroy();
        }
        this.children.splice(e, t - e, ...n);
        for(let r = 0; r < n.length; r++)n[r].setParent(this);
    }
    ignoreMutation(e) {
        return !1;
    }
    ignoreEvent(e) {
        return !1;
    }
    childCursor(e = this.length) {
        return new qd(this.children, e, this.children.length);
    }
    childPos(e, t = 1) {
        return this.childCursor().findPos(e, t);
    }
    toString() {
        let e = this.constructor.name.replace("View", "");
        return e + (this.children.length ? "(" + this.children.join() + ")" : this.length ? "[" + (e == "Text" ? this.text : this.length) + "]" : "") + (this.breakAfter ? "#" : "");
    }
    static get(e) {
        return e.cmView;
    }
    get isEditable() {
        return !0;
    }
    get isWidget() {
        return !1;
    }
    get isHidden() {
        return !1;
    }
    merge(e, t, n, r, s, o) {
        return !1;
    }
    become(e) {
        return !1;
    }
    canReuseDOM(e) {
        return e.constructor == this.constructor && !((this.flags | e.flags) & 8);
    }
    getSide() {
        return 0;
    }
    destroy() {
        this.parent = null;
    }
}
fe.prototype.breakAfter = 0;
function sh(i) {
    let e = i.nextSibling;
    return i.parentNode.removeChild(i), e;
}
class qd {
    constructor(e, t, n){
        this.children = e, this.pos = t, this.i = n, this.off = 0;
    }
    findPos(e, t = 1) {
        for(;;){
            if (e > this.pos || e == this.pos && (t > 0 || this.i == 0 || this.children[this.i - 1].breakAfter)) return this.off = e - this.pos, this;
            let n = this.children[--this.i];
            this.pos -= n.length + n.breakAfter;
        }
    }
}
function jd(i, e, t, n, r, s, o, l, a) {
    let { children: c } = i, h = c.length ? c[e] : null, u = s.length ? s[s.length - 1] : null, f = u ? u.breakAfter : o;
    if (!(e == n && h && !o && !f && s.length < 2 && h.merge(t, r, s.length ? u : null, t == 0, l, a))) {
        if (n < c.length) {
            let d = c[n];
            d && (r < d.length || d.breakAfter && u != null && u.breakAfter) ? (e == n && (d = d.split(r), r = 0), !f && u && d.merge(0, r, u, !0, 0, a) ? s[s.length - 1] = d : ((r || d.children.length && !d.children[0].length) && d.merge(0, r, null, !1, 0, a), s.push(d))) : d != null && d.breakAfter && (u ? u.breakAfter = 1 : o = 1), n++;
        }
        for(h && (h.breakAfter = o, t > 0 && (!o && s.length && h.merge(t, h.length, s[0], !1, l, 0) ? h.breakAfter = s.shift().breakAfter : (t < h.length || h.children.length && h.children[h.children.length - 1].length == 0) && h.merge(t, h.length, null, !1, l, 0), e++)); e < n && s.length;)if (c[n - 1].become(s[s.length - 1])) n--, s.pop(), a = s.length ? 0 : l;
        else if (c[e].become(s[0])) e++, s.shift(), l = s.length ? 0 : a;
        else break;
        !s.length && e && n < c.length && !c[e - 1].breakAfter && c[n].merge(0, 0, c[e - 1], !1, l, a) && e--, (e < n || s.length) && i.replaceChildren(e, n, s);
    }
}
function Fd(i, e, t, n, r, s) {
    let o = i.childCursor(), { i: l, off: a } = o.findPos(t, 1), { i: c, off: h } = o.findPos(e, -1), u = e - t;
    for (let f of n)u += f.length;
    i.length += u, jd(i, c, h, l, a, n, 0, r, s);
}
let st = typeof navigator < "u" ? navigator : {
    userAgent: "",
    vendor: "",
    platform: ""
}, Dl = typeof document < "u" ? document : {
    documentElement: {
        style: {}
    }
};
const Pl = /Edge\/(\d+)/.exec(st.userAgent), Hd = /MSIE \d/.test(st.userAgent), Ml = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(st.userAgent), So = !!(Hd || Ml || Pl), oh = !So && /gecko\/(\d+)/i.test(st.userAgent), $o = !So && /Chrome\/(\d+)/.exec(st.userAgent), lh = "webkitFontSmoothing" in Dl.documentElement.style, Wd = !So && /Apple Computer/.test(st.vendor), ah = Wd && (/Mobile\/\w+/.test(st.userAgent) || st.maxTouchPoints > 2);
var I = {
    mac: ah || /Mac/.test(st.platform),
    windows: /Win/.test(st.platform),
    linux: /Linux|X11/.test(st.platform),
    ie: So,
    ie_version: Hd ? Dl.documentMode || 6 : Ml ? +Ml[1] : Pl ? +Pl[1] : 0,
    gecko: oh,
    gecko_version: oh ? +(/Firefox\/(\d+)/.exec(st.userAgent) || [
        0,
        0
    ])[1] : 0,
    chrome: !!$o,
    chrome_version: $o ? +$o[1] : 0,
    ios: ah,
    android: /Android\b/.test(st.userAgent),
    webkit: lh,
    safari: Wd,
    webkit_version: lh ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [
        0,
        0
    ])[1] : 0,
    tabSize: Dl.documentElement.style.tabSize != null ? "tab-size" : "-moz-tab-size"
};
const Gm = 256;
class ni extends fe {
    constructor(e){
        super(), this.text = e;
    }
    get length() {
        return this.text.length;
    }
    createDOM(e) {
        this.setDOM(e || document.createTextNode(this.text));
    }
    sync(e, t) {
        this.dom || this.createDOM(), this.dom.nodeValue != this.text && (t && t.node == this.dom && (t.written = !0), this.dom.nodeValue = this.text);
    }
    reuseDOM(e) {
        e.nodeType == 3 && this.createDOM(e);
    }
    merge(e, t, n) {
        return this.flags & 8 || n && (!(n instanceof ni) || this.length - (t - e) + n.length > Gm || n.flags & 8) ? !1 : (this.text = this.text.slice(0, e) + (n ? n.text : "") + this.text.slice(t), this.markDirty(), !0);
    }
    split(e) {
        let t = new ni(this.text.slice(e));
        return this.text = this.text.slice(0, e), this.markDirty(), t.flags |= this.flags & 8, t;
    }
    localPosFromDOM(e, t) {
        return e == this.dom ? t : t ? this.text.length : 0;
    }
    domAtPos(e) {
        return new He(this.dom, e);
    }
    domBoundsAround(e, t, n) {
        return {
            from: n,
            to: n + this.length,
            startDOM: this.dom,
            endDOM: this.dom.nextSibling
        };
    }
    coordsAt(e, t) {
        return Jm(this.dom, e, t);
    }
}
class ri extends fe {
    constructor(e, t = [], n = 0){
        super(), this.mark = e, this.children = t, this.length = n;
        for (let r of t)r.setParent(this);
    }
    setAttrs(e) {
        if (Bd(e), this.mark.class && (e.className = this.mark.class), this.mark.attrs) for(let t in this.mark.attrs)e.setAttribute(t, this.mark.attrs[t]);
        return e;
    }
    canReuseDOM(e) {
        return super.canReuseDOM(e) && !((this.flags | e.flags) & 8);
    }
    reuseDOM(e) {
        e.nodeName == this.mark.tagName.toUpperCase() && (this.setDOM(e), this.flags |= 6);
    }
    sync(e, t) {
        this.dom ? this.flags & 4 && this.setAttrs(this.dom) : this.setDOM(this.setAttrs(document.createElement(this.mark.tagName))), super.sync(e, t);
    }
    merge(e, t, n, r, s, o) {
        return n && (!(n instanceof ri && n.mark.eq(this.mark)) || e && s <= 0 || t < this.length && o <= 0) ? !1 : (Fd(this, e, t, n ? n.children : [], s - 1, o - 1), this.markDirty(), !0);
    }
    split(e) {
        let t = [], n = 0, r = -1, s = 0;
        for (let l of this.children){
            let a = n + l.length;
            a > e && t.push(n < e ? l.split(e - n) : l), r < 0 && n >= e && (r = s), n = a, s++;
        }
        let o = this.length - e;
        return this.length = e, r > -1 && (this.children.length = r, this.markDirty()), new ri(this.mark, t, o);
    }
    domAtPos(e) {
        return Vd(this, e);
    }
    coordsAt(e, t) {
        return zd(this, e, t);
    }
}
function Jm(i, e, t) {
    let n = i.nodeValue.length;
    e > n && (e = n);
    let r = e, s = e, o = 0;
    e == 0 && t < 0 || e == n && t >= 0 ? I.chrome || I.gecko || (e ? (r--, o = 1) : s < n && (s++, o = -1)) : t < 0 ? r-- : s < n && s++;
    let l = Ui(i, r, s).getClientRects();
    if (!l.length) return null;
    let a = l[(o ? o < 0 : t >= 0) ? 0 : l.length - 1];
    return I.safari && !o && a.width == 0 && (a = Array.prototype.find.call(l, (c)=>c.width) || a), o ? ko(a, o < 0) : a || null;
}
class gi extends fe {
    static create(e, t, n) {
        return new gi(e, t, n);
    }
    constructor(e, t, n){
        super(), this.widget = e, this.length = t, this.side = n, this.prevWidget = null;
    }
    split(e) {
        let t = gi.create(this.widget, this.length - e, this.side);
        return this.length -= e, t;
    }
    sync(e) {
        (!this.dom || !this.widget.updateDOM(this.dom, e)) && (this.dom && this.prevWidget && this.prevWidget.destroy(this.dom), this.prevWidget = null, this.setDOM(this.widget.toDOM(e)), this.dom.contentEditable = "false");
    }
    getSide() {
        return this.side;
    }
    merge(e, t, n, r, s, o) {
        return n && (!(n instanceof gi) || !this.widget.compare(n.widget) || e > 0 && s <= 0 || t < this.length && o <= 0) ? !1 : (this.length = e + (n ? n.length : 0) + (this.length - t), !0);
    }
    become(e) {
        return e instanceof gi && e.side == this.side && this.widget.constructor == e.widget.constructor ? (this.widget.compare(e.widget) || this.markDirty(!0), this.dom && !this.prevWidget && (this.prevWidget = this.widget), this.widget = e.widget, this.length = e.length, !0) : !1;
    }
    ignoreMutation() {
        return !0;
    }
    ignoreEvent(e) {
        return this.widget.ignoreEvent(e);
    }
    get overrideDOMText() {
        if (this.length == 0) return X.empty;
        let e = this;
        for(; e.parent;)e = e.parent;
        let { view: t } = e, n = t && t.state.doc, r = this.posAtStart;
        return n ? n.slice(r, r + this.length) : X.empty;
    }
    domAtPos(e) {
        return (this.length ? e == 0 : this.side > 0) ? He.before(this.dom) : He.after(this.dom, e == this.length);
    }
    domBoundsAround() {
        return null;
    }
    coordsAt(e, t) {
        let n = this.widget.coordsAt(this.dom, e, t);
        if (n) return n;
        let r = this.dom.getClientRects(), s = null;
        if (!r.length) return null;
        let o = this.side ? this.side < 0 : e > 0;
        for(let l = o ? r.length - 1 : 0; s = r[l], !(e > 0 ? l == 0 : l == r.length - 1 || s.top < s.bottom); l += o ? -1 : 1);
        return ko(s, !o);
    }
    get isEditable() {
        return !1;
    }
    get isWidget() {
        return !0;
    }
    get isHidden() {
        return this.widget.isHidden;
    }
    destroy() {
        super.destroy(), this.dom && this.widget.destroy(this.dom);
    }
}
class mn extends fe {
    constructor(e){
        super(), this.side = e;
    }
    get length() {
        return 0;
    }
    merge() {
        return !1;
    }
    become(e) {
        return e instanceof mn && e.side == this.side;
    }
    split() {
        return new mn(this.side);
    }
    sync() {
        if (!this.dom) {
            let e = document.createElement("img");
            e.className = "cm-widgetBuffer", e.setAttribute("aria-hidden", "true"), this.setDOM(e);
        }
    }
    getSide() {
        return this.side;
    }
    domAtPos(e) {
        return this.side > 0 ? He.before(this.dom) : He.after(this.dom);
    }
    localPosFromDOM() {
        return 0;
    }
    domBoundsAround() {
        return null;
    }
    coordsAt(e) {
        return this.dom.getBoundingClientRect();
    }
    get overrideDOMText() {
        return X.empty;
    }
    get isHidden() {
        return !0;
    }
}
ni.prototype.children = gi.prototype.children = mn.prototype.children = dc;
function Vd(i, e) {
    let t = i.dom, { children: n } = i, r = 0;
    for(let s = 0; r < n.length; r++){
        let o = n[r], l = s + o.length;
        if (!(l == s && o.getSide() <= 0)) {
            if (e > s && e < l && o.dom.parentNode == t) return o.domAtPos(e - s);
            if (e <= s) break;
            s = l;
        }
    }
    for(let s = r; s > 0; s--){
        let o = n[s - 1];
        if (o.dom.parentNode == t) return o.domAtPos(o.length);
    }
    for(let s = r; s < n.length; s++){
        let o = n[s];
        if (o.dom.parentNode == t) return o.domAtPos(0);
    }
    return new He(t, 0);
}
function $d(i, e, t) {
    let n, { children: r } = i;
    t > 0 && e instanceof ri && r.length && (n = r[r.length - 1]) instanceof ri && n.mark.eq(e.mark) ? $d(n, e.children[0], t - 1) : (r.push(e), e.setParent(i)), i.length += e.length;
}
function zd(i, e, t) {
    let n = null, r = -1, s = null, o = -1;
    function l(c, h) {
        for(let u = 0, f = 0; u < c.children.length && f <= h; u++){
            let d = c.children[u], p = f + d.length;
            p >= h && (d.children.length ? l(d, h - f) : (!s || s.isHidden && t > 0) && (p > h || f == p && d.getSide() > 0) ? (s = d, o = h - f) : (f < h || f == p && d.getSide() < 0 && !d.isHidden) && (n = d, r = h - f)), f = p;
        }
    }
    l(i, e);
    let a = (t < 0 ? n : s) || n || s;
    return a ? a.coordsAt(Math.max(0, a == n ? r : o), t) : Qm(i);
}
function Qm(i) {
    let e = i.dom.lastChild;
    if (!e) return i.dom.getBoundingClientRect();
    let t = gn(e);
    return t[t.length - 1] || null;
}
function Al(i, e) {
    for(let t in i)t == "class" && e.class ? e.class += " " + i.class : t == "style" && e.style ? e.style += ";" + i.style : e[t] = i[t];
    return e;
}
const ch = Object.create(null);
function pc(i, e, t) {
    if (i == e) return !0;
    i || (i = ch), e || (e = ch);
    let n = Object.keys(i), r = Object.keys(e);
    if (n.length - (t && n.indexOf(t) > -1 ? 1 : 0) != r.length - (t && r.indexOf(t) > -1 ? 1 : 0)) return !1;
    for (let s of n)if (s != t && (r.indexOf(s) == -1 || i[s] !== e[s])) return !1;
    return !0;
}
function _l(i, e, t) {
    let n = !1;
    if (e) for(let r in e)t && r in t || (n = !0, r == "style" ? i.style.cssText = "" : i.removeAttribute(r));
    if (t) for(let r in t)e && e[r] == t[r] || (n = !0, r == "style" ? i.style.cssText = t[r] : i.setAttribute(r, t[r]));
    return n;
}
function Ym(i) {
    let e = Object.create(null);
    for(let t = 0; t < i.attributes.length; t++){
        let n = i.attributes[t];
        e[n.name] = n.value;
    }
    return e;
}
class Oe extends fe {
    constructor(){
        super(...arguments), this.children = [], this.length = 0, this.prevAttrs = void 0, this.attrs = null, this.breakAfter = 0;
    }
    merge(e, t, n, r, s, o) {
        if (n) {
            if (!(n instanceof Oe)) return !1;
            this.dom || n.transferDOM(this);
        }
        return r && this.setDeco(n ? n.attrs : null), Fd(this, e, t, n ? n.children : [], s, o), !0;
    }
    split(e) {
        let t = new Oe;
        if (t.breakAfter = this.breakAfter, this.length == 0) return t;
        let { i: n, off: r } = this.childPos(e);
        r && (t.append(this.children[n].split(r), 0), this.children[n].merge(r, this.children[n].length, null, !1, 0, 0), n++);
        for(let s = n; s < this.children.length; s++)t.append(this.children[s], 0);
        for(; n > 0 && this.children[n - 1].length == 0;)this.children[--n].destroy();
        return this.children.length = n, this.markDirty(), this.length = e, t;
    }
    transferDOM(e) {
        this.dom && (this.markDirty(), e.setDOM(this.dom), e.prevAttrs = this.prevAttrs === void 0 ? this.attrs : this.prevAttrs, this.prevAttrs = void 0, this.dom = null);
    }
    setDeco(e) {
        pc(this.attrs, e) || (this.dom && (this.prevAttrs = this.attrs, this.markDirty()), this.attrs = e);
    }
    append(e, t) {
        $d(this, e, t);
    }
    addLineDeco(e) {
        let t = e.spec.attributes, n = e.spec.class;
        t && (this.attrs = Al(t, this.attrs || {})), n && (this.attrs = Al({
            class: n
        }, this.attrs || {}));
    }
    domAtPos(e) {
        return Vd(this, e);
    }
    reuseDOM(e) {
        e.nodeName == "DIV" && (this.setDOM(e), this.flags |= 6);
    }
    sync(e, t) {
        var n;
        this.dom ? this.flags & 4 && (Bd(this.dom), this.dom.className = "cm-line", this.prevAttrs = this.attrs ? null : void 0) : (this.setDOM(document.createElement("div")), this.dom.className = "cm-line", this.prevAttrs = this.attrs ? null : void 0), this.prevAttrs !== void 0 && (_l(this.dom, this.prevAttrs, this.attrs), this.dom.classList.add("cm-line"), this.prevAttrs = void 0), super.sync(e, t);
        let r = this.dom.lastChild;
        for(; r && fe.get(r) instanceof ri;)r = r.lastChild;
        if (!r || !this.length || r.nodeName != "BR" && ((n = fe.get(r)) === null || n === void 0 ? void 0 : n.isEditable) == !1 && (!I.ios || !this.children.some((s)=>s instanceof ni))) {
            let s = document.createElement("BR");
            s.cmIgnore = !0, this.dom.appendChild(s);
        }
    }
    measureTextSize() {
        if (this.children.length == 0 || this.length > 20) return null;
        let e = 0, t;
        for (let n of this.children){
            if (!(n instanceof ni) || /[^ -~]/.test(n.text)) return null;
            let r = gn(n.dom);
            if (r.length != 1) return null;
            e += r[0].width, t = r[0].height;
        }
        return e ? {
            lineHeight: this.dom.getBoundingClientRect().height,
            charWidth: e / this.length,
            textHeight: t
        } : null;
    }
    coordsAt(e, t) {
        let n = zd(this, e, t);
        if (!this.children.length && n && this.parent) {
            let { heightOracle: r } = this.parent.view.viewState, s = n.bottom - n.top;
            if (Math.abs(s - r.lineHeight) < 2 && r.textHeight < s) {
                let o = (s - r.textHeight) / 2;
                return {
                    top: n.top + o,
                    bottom: n.bottom - o,
                    left: n.left,
                    right: n.left
                };
            }
        }
        return n;
    }
    become(e) {
        return !1;
    }
    covers() {
        return !0;
    }
    static find(e, t) {
        for(let n = 0, r = 0; n < e.children.length; n++){
            let s = e.children[n], o = r + s.length;
            if (o >= t) {
                if (s instanceof Oe) return s;
                if (o > t) break;
            }
            r = o + s.breakAfter;
        }
        return null;
    }
}
class bi extends fe {
    constructor(e, t, n){
        super(), this.widget = e, this.length = t, this.deco = n, this.breakAfter = 0, this.prevWidget = null;
    }
    merge(e, t, n, r, s, o) {
        return n && (!(n instanceof bi) || !this.widget.compare(n.widget) || e > 0 && s <= 0 || t < this.length && o <= 0) ? !1 : (this.length = e + (n ? n.length : 0) + (this.length - t), !0);
    }
    domAtPos(e) {
        return e == 0 ? He.before(this.dom) : He.after(this.dom, e == this.length);
    }
    split(e) {
        let t = this.length - e;
        this.length = e;
        let n = new bi(this.widget, t, this.deco);
        return n.breakAfter = this.breakAfter, n;
    }
    get children() {
        return dc;
    }
    sync(e) {
        (!this.dom || !this.widget.updateDOM(this.dom, e)) && (this.dom && this.prevWidget && this.prevWidget.destroy(this.dom), this.prevWidget = null, this.setDOM(this.widget.toDOM(e)), this.dom.contentEditable = "false");
    }
    get overrideDOMText() {
        return this.parent ? this.parent.view.state.doc.slice(this.posAtStart, this.posAtEnd) : X.empty;
    }
    domBoundsAround() {
        return null;
    }
    become(e) {
        return e instanceof bi && e.widget.constructor == this.widget.constructor ? (e.widget.compare(this.widget) || this.markDirty(!0), this.dom && !this.prevWidget && (this.prevWidget = this.widget), this.widget = e.widget, this.length = e.length, this.deco = e.deco, this.breakAfter = e.breakAfter, !0) : !1;
    }
    ignoreMutation() {
        return !0;
    }
    ignoreEvent(e) {
        return this.widget.ignoreEvent(e);
    }
    get isEditable() {
        return !1;
    }
    get isWidget() {
        return !0;
    }
    coordsAt(e, t) {
        return this.widget.coordsAt(this.dom, e, t);
    }
    destroy() {
        super.destroy(), this.dom && this.widget.destroy(this.dom);
    }
    covers(e) {
        let { startSide: t, endSide: n } = this.deco;
        return t == n ? !1 : e < 0 ? t < 0 : n > 0;
    }
}
class li {
    eq(e) {
        return !1;
    }
    updateDOM(e, t) {
        return !1;
    }
    compare(e) {
        return this == e || this.constructor == e.constructor && this.eq(e);
    }
    get estimatedHeight() {
        return -1;
    }
    get lineBreaks() {
        return 0;
    }
    ignoreEvent(e) {
        return !0;
    }
    coordsAt(e, t, n) {
        return null;
    }
    get isHidden() {
        return !1;
    }
    destroy(e) {}
}
var Ke = function(i) {
    return i[i.Text = 0] = "Text", i[i.WidgetBefore = 1] = "WidgetBefore", i[i.WidgetAfter = 2] = "WidgetAfter", i[i.WidgetRange = 3] = "WidgetRange", i;
}(Ke || (Ke = {}));
class ee extends $i {
    constructor(e, t, n, r){
        super(), this.startSide = e, this.endSide = t, this.widget = n, this.spec = r;
    }
    get heightRelevant() {
        return !1;
    }
    static mark(e) {
        return new _r(e);
    }
    static widget(e) {
        let t = Math.max(-10000, Math.min(1e4, e.side || 0)), n = !!e.block;
        return t += n && !e.inlineOrder ? t > 0 ? 3e8 : -400000000 : t > 0 ? 1e8 : -100000000, new Oi(e, t, t, n, e.widget || null, !1);
    }
    static replace(e) {
        let t = !!e.block, n, r;
        if (e.isBlockGap) n = -500000000, r = 4e8;
        else {
            let { start: s, end: o } = Ud(e, t);
            n = (s ? t ? -300000000 : -1 : 5e8) - 1, r = (o ? t ? 2e8 : 1 : -600000000) + 1;
        }
        return new Oi(e, n, r, t, e.widget || null, !0);
    }
    static line(e) {
        return new Er(e);
    }
    static set(e, t = !1) {
        return le.of(e, t);
    }
    hasHeight() {
        return this.widget ? this.widget.estimatedHeight > -1 : !1;
    }
}
ee.none = le.empty;
class _r extends ee {
    constructor(e){
        let { start: t, end: n } = Ud(e);
        super(t ? -1 : 5e8, n ? 1 : -600000000, null, e), this.tagName = e.tagName || "span", this.class = e.class || "", this.attrs = e.attributes || null;
    }
    eq(e) {
        var t, n;
        return this == e || e instanceof _r && this.tagName == e.tagName && (this.class || ((t = this.attrs) === null || t === void 0 ? void 0 : t.class)) == (e.class || ((n = e.attrs) === null || n === void 0 ? void 0 : n.class)) && pc(this.attrs, e.attrs, "class");
    }
    range(e, t = e) {
        if (e >= t) throw new RangeError("Mark decorations may not be empty");
        return super.range(e, t);
    }
}
_r.prototype.point = !1;
class Er extends ee {
    constructor(e){
        super(-200000000, -200000000, null, e);
    }
    eq(e) {
        return e instanceof Er && this.spec.class == e.spec.class && pc(this.spec.attributes, e.spec.attributes);
    }
    range(e, t = e) {
        if (t != e) throw new RangeError("Line decoration ranges must be zero-length");
        return super.range(e, t);
    }
}
Er.prototype.mapMode = Ye.TrackBefore;
Er.prototype.point = !0;
class Oi extends ee {
    constructor(e, t, n, r, s, o){
        super(t, n, s, e), this.block = r, this.isReplace = o, this.mapMode = r ? t <= 0 ? Ye.TrackBefore : Ye.TrackAfter : Ye.TrackDel;
    }
    get type() {
        return this.startSide != this.endSide ? Ke.WidgetRange : this.startSide <= 0 ? Ke.WidgetBefore : Ke.WidgetAfter;
    }
    get heightRelevant() {
        return this.block || !!this.widget && (this.widget.estimatedHeight >= 5 || this.widget.lineBreaks > 0);
    }
    eq(e) {
        return e instanceof Oi && Xm(this.widget, e.widget) && this.block == e.block && this.startSide == e.startSide && this.endSide == e.endSide;
    }
    range(e, t = e) {
        if (this.isReplace && (e > t || e == t && this.startSide > 0 && this.endSide <= 0)) throw new RangeError("Invalid range for replacement decoration");
        if (!this.isReplace && t != e) throw new RangeError("Widget decorations can only have zero-length ranges");
        return super.range(e, t);
    }
}
Oi.prototype.point = !0;
function Ud(i, e = !1) {
    let { inclusiveStart: t, inclusiveEnd: n } = i;
    return t == null && (t = i.inclusive), n == null && (n = i.inclusive), {
        start: t ?? e,
        end: n ?? e
    };
}
function Xm(i, e) {
    return i == e || !!(i && e && i.compare(e));
}
function El(i, e, t, n = 0) {
    let r = t.length - 1;
    r >= 0 && t[r] + n >= i ? t[r] = Math.max(t[r], e) : t.push(i, e);
}
class ur {
    constructor(e, t, n, r){
        this.doc = e, this.pos = t, this.end = n, this.disallowBlockEffectsFor = r, this.content = [], this.curLine = null, this.breakAtStart = 0, this.pendingBuffer = 0, this.bufferMarks = [], this.atCursorPos = !0, this.openStart = -1, this.openEnd = -1, this.text = "", this.textOff = 0, this.cursor = e.iter(), this.skip = t;
    }
    posCovered() {
        if (this.content.length == 0) return !this.breakAtStart && this.doc.lineAt(this.pos).from != this.pos;
        let e = this.content[this.content.length - 1];
        return !(e.breakAfter || e instanceof bi && e.deco.endSide < 0);
    }
    getLine() {
        return this.curLine || (this.content.push(this.curLine = new Oe), this.atCursorPos = !0), this.curLine;
    }
    flushBuffer(e = this.bufferMarks) {
        this.pendingBuffer && (this.curLine.append(ls(new mn(-1), e), e.length), this.pendingBuffer = 0);
    }
    addBlockWidget(e) {
        this.flushBuffer(), this.curLine = null, this.content.push(e);
    }
    finish(e) {
        this.pendingBuffer && e <= this.bufferMarks.length ? this.flushBuffer() : this.pendingBuffer = 0, !this.posCovered() && !(e && this.content.length && this.content[this.content.length - 1] instanceof bi) && this.getLine();
    }
    buildText(e, t, n) {
        for(; e > 0;){
            if (this.textOff == this.text.length) {
                let { value: s, lineBreak: o, done: l } = this.cursor.next(this.skip);
                if (this.skip = 0, l) throw new Error("Ran out of text content when drawing inline views");
                if (o) {
                    this.posCovered() || this.getLine(), this.content.length ? this.content[this.content.length - 1].breakAfter = 1 : this.breakAtStart = 1, this.flushBuffer(), this.curLine = null, this.atCursorPos = !0, e--;
                    continue;
                } else this.text = s, this.textOff = 0;
            }
            let r = Math.min(this.text.length - this.textOff, e, 512);
            this.flushBuffer(t.slice(t.length - n)), this.getLine().append(ls(new ni(this.text.slice(this.textOff, this.textOff + r)), t), n), this.atCursorPos = !0, this.textOff += r, e -= r, n = 0;
        }
    }
    span(e, t, n, r) {
        this.buildText(t - e, n, r), this.pos = t, this.openStart < 0 && (this.openStart = r);
    }
    point(e, t, n, r, s, o) {
        if (this.disallowBlockEffectsFor[o] && n instanceof Oi) {
            if (n.block) throw new RangeError("Block decorations may not be specified via plugins");
            if (t > this.doc.lineAt(this.pos).to) throw new RangeError("Decorations that replace line breaks may not be specified via plugins");
        }
        let l = t - e;
        if (n instanceof Oi) {
            if (n.block) n.startSide > 0 && !this.posCovered() && this.getLine(), this.addBlockWidget(new bi(n.widget || new hh("div"), l, n));
            else {
                let a = gi.create(n.widget || new hh("span"), l, l ? 0 : n.startSide), c = this.atCursorPos && !a.isEditable && s <= r.length && (e < t || n.startSide > 0), h = !a.isEditable && (e < t || s > r.length || n.startSide <= 0), u = this.getLine();
                this.pendingBuffer == 2 && !c && !a.isEditable && (this.pendingBuffer = 0), this.flushBuffer(r), c && (u.append(ls(new mn(1), r), s), s = r.length + Math.max(0, s - r.length)), u.append(ls(a, r), s), this.atCursorPos = h, this.pendingBuffer = h ? e < t || s > r.length ? 1 : 2 : 0, this.pendingBuffer && (this.bufferMarks = r.slice());
            }
        } else this.doc.lineAt(this.pos).from == this.pos && this.getLine().addLineDeco(n);
        l && (this.textOff + l <= this.text.length ? this.textOff += l : (this.skip += l - (this.text.length - this.textOff), this.text = "", this.textOff = 0), this.pos = t), this.openStart < 0 && (this.openStart = s);
    }
    static build(e, t, n, r, s) {
        let o = new ur(e, t, n, s);
        return o.openEnd = le.spans(r, t, n, o), o.openStart < 0 && (o.openStart = o.openEnd), o.finish(o.openEnd), o;
    }
}
function ls(i, e) {
    for (let t of e)i = new ri(t, [
        i
    ], i.length);
    return i;
}
class hh extends li {
    constructor(e){
        super(), this.tag = e;
    }
    eq(e) {
        return e.tag == this.tag;
    }
    toDOM() {
        return document.createElement(this.tag);
    }
    updateDOM(e) {
        return e.nodeName.toLowerCase() == this.tag;
    }
    get isHidden() {
        return !0;
    }
}
const Kd = q.define(), Gd = q.define(), Jd = q.define(), Qd = q.define(), Nl = q.define(), Yd = q.define(), Xd = q.define(), Zd = q.define({
    combine: (i)=>i.some((e)=>e)
}), ep = q.define({
    combine: (i)=>i.some((e)=>e)
});
class Ws {
    constructor(e, t = "nearest", n = "nearest", r = 5, s = 5){
        this.range = e, this.y = t, this.x = n, this.yMargin = r, this.xMargin = s;
    }
    map(e) {
        return e.empty ? this : new Ws(this.range.map(e), this.y, this.x, this.yMargin, this.xMargin);
    }
}
const uh = Z.define({
    map: (i, e)=>i.map(e)
});
function Tt(i, e, t) {
    let n = i.facet(Qd);
    n.length ? n[0](e) : window.onerror ? window.onerror(String(e), t, void 0, void 0, e) : t ? console.error(t + ":", e) : console.error(e);
}
const Co = q.define({
    combine: (i)=>i.length ? i[0] : !0
});
let Zm = 0;
const sr = q.define();
class Ie {
    constructor(e, t, n, r, s){
        this.id = e, this.create = t, this.domEventHandlers = n, this.domEventObservers = r, this.extension = s(this);
    }
    static define(e, t) {
        const { eventHandlers: n, eventObservers: r, provide: s, decorations: o } = t || {};
        return new Ie(Zm++, e, n, r, (l)=>{
            let a = [
                sr.of(l)
            ];
            return o && a.push(mr.of((c)=>{
                let h = c.plugin(l);
                return h ? o(h) : ee.none;
            })), s && a.push(s(l)), a;
        });
    }
    static fromClass(e, t) {
        return Ie.define((n)=>new e(n), t);
    }
}
class zo {
    constructor(e){
        this.spec = e, this.mustUpdate = null, this.value = null;
    }
    update(e) {
        if (this.value) {
            if (this.mustUpdate) {
                let t = this.mustUpdate;
                if (this.mustUpdate = null, this.value.update) try {
                    this.value.update(t);
                } catch (n) {
                    if (Tt(t.state, n, "CodeMirror plugin crashed"), this.value.destroy) try {
                        this.value.destroy();
                    } catch  {}
                    this.deactivate();
                }
            }
        } else if (this.spec) try {
            this.value = this.spec.create(e);
        } catch (t) {
            Tt(e.state, t, "CodeMirror plugin crashed"), this.deactivate();
        }
        return this;
    }
    destroy(e) {
        var t;
        if (!((t = this.value) === null || t === void 0) && t.destroy) try {
            this.value.destroy();
        } catch (n) {
            Tt(e.state, n, "CodeMirror plugin crashed");
        }
    }
    deactivate() {
        this.spec = this.value = null;
    }
}
const tp = q.define(), gc = q.define(), mr = q.define(), mc = q.define(), ip = q.define();
function fh(i, e, t) {
    let n = i.state.facet(ip);
    if (!n.length) return n;
    let r = n.map((o)=>o instanceof Function ? o(i) : o), s = [];
    return le.spans(r, e, t, {
        point () {},
        span (o, l, a, c) {
            let h = s;
            for(let u = a.length - 1; u >= 0; u--, c--){
                let f = a[u].spec.bidiIsolate, d;
                if (f != null) {
                    if (c > 0 && h.length && (d = h[h.length - 1]).to == o && d.direction == f) d.to = l, h = d.inner;
                    else {
                        let p = {
                            from: o,
                            to: l,
                            direction: f,
                            inner: []
                        };
                        h.push(p), h = p.inner;
                    }
                }
            }
        }
    }), s;
}
const np = q.define();
function rp(i) {
    let e = 0, t = 0, n = 0, r = 0;
    for (let s of i.state.facet(np)){
        let o = s(i);
        o && (o.left != null && (e = Math.max(e, o.left)), o.right != null && (t = Math.max(t, o.right)), o.top != null && (n = Math.max(n, o.top)), o.bottom != null && (r = Math.max(r, o.bottom)));
    }
    return {
        left: e,
        right: t,
        top: n,
        bottom: r
    };
}
const or = q.define();
class ut {
    constructor(e, t, n, r){
        this.fromA = e, this.toA = t, this.fromB = n, this.toB = r;
    }
    join(e) {
        return new ut(Math.min(this.fromA, e.fromA), Math.max(this.toA, e.toA), Math.min(this.fromB, e.fromB), Math.max(this.toB, e.toB));
    }
    addToSet(e) {
        let t = e.length, n = this;
        for(; t > 0; t--){
            let r = e[t - 1];
            if (!(r.fromA > n.toA)) {
                if (r.toA < n.fromA) break;
                n = n.join(r), e.splice(t - 1, 1);
            }
        }
        return e.splice(t, 0, n), e;
    }
    static extendWithRanges(e, t) {
        if (t.length == 0) return e;
        let n = [];
        for(let r = 0, s = 0, o = 0, l = 0;; r++){
            let a = r == e.length ? null : e[r], c = o - l, h = a ? a.fromB : 1e9;
            for(; s < t.length && t[s] < h;){
                let u = t[s], f = t[s + 1], d = Math.max(l, u), p = Math.min(h, f);
                if (d <= p && new ut(d + c, p + c, d, p).addToSet(n), f > h) break;
                s += 2;
            }
            if (!a) return n;
            new ut(a.fromA, a.toA, a.fromB, a.toB).addToSet(n), o = a.toA, l = a.toB;
        }
    }
}
class Vs {
    constructor(e, t, n){
        this.view = e, this.state = t, this.transactions = n, this.flags = 0, this.startState = e.state, this.changes = De.empty(this.startState.doc.length);
        for (let s of n)this.changes = this.changes.compose(s.changes);
        let r = [];
        this.changes.iterChangedRanges((s, o, l, a)=>r.push(new ut(s, o, l, a))), this.changedRanges = r;
    }
    static create(e, t, n) {
        return new Vs(e, t, n);
    }
    get viewportChanged() {
        return (this.flags & 4) > 0;
    }
    get heightChanged() {
        return (this.flags & 2) > 0;
    }
    get geometryChanged() {
        return this.docChanged || (this.flags & 10) > 0;
    }
    get focusChanged() {
        return (this.flags & 1) > 0;
    }
    get docChanged() {
        return !this.changes.empty;
    }
    get selectionSet() {
        return this.transactions.some((e)=>e.selection);
    }
    get empty() {
        return this.flags == 0 && this.transactions.length == 0;
    }
}
var ge = function(i) {
    return i[i.LTR = 0] = "LTR", i[i.RTL = 1] = "RTL", i;
}(ge || (ge = {}));
const yr = ge.LTR, sp = ge.RTL;
function op(i) {
    let e = [];
    for(let t = 0; t < i.length; t++)e.push(1 << +i[t]);
    return e;
}
const e0 = op("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008"), t0 = op("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333"), Ll = Object.create(null), At = [];
for (let i of [
    "()",
    "[]",
    "{}"
]){
    let e = i.charCodeAt(0), t = i.charCodeAt(1);
    Ll[e] = t, Ll[t] = -e;
}
function i0(i) {
    return i <= 247 ? e0[i] : 1424 <= i && i <= 1524 ? 2 : 1536 <= i && i <= 1785 ? t0[i - 1536] : 1774 <= i && i <= 2220 ? 4 : 8192 <= i && i <= 8203 ? 256 : 64336 <= i && i <= 65023 ? 4 : i == 8204 ? 256 : 1;
}
const n0 = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/;
class mi {
    get dir() {
        return this.level % 2 ? sp : yr;
    }
    constructor(e, t, n){
        this.from = e, this.to = t, this.level = n;
    }
    side(e, t) {
        return this.dir == t == e ? this.to : this.from;
    }
    static find(e, t, n, r) {
        let s = -1;
        for(let o = 0; o < e.length; o++){
            let l = e[o];
            if (l.from <= t && l.to >= t) {
                if (l.level == n) return o;
                (s < 0 || (r != 0 ? r < 0 ? l.from < t : l.to > t : e[s].level > l.level)) && (s = o);
            }
        }
        if (s < 0) throw new RangeError("Index out of range");
        return s;
    }
}
function lp(i, e) {
    if (i.length != e.length) return !1;
    for(let t = 0; t < i.length; t++){
        let n = i[t], r = e[t];
        if (n.from != r.from || n.to != r.to || n.direction != r.direction || !lp(n.inner, r.inner)) return !1;
    }
    return !0;
}
const oe = [];
function r0(i, e, t, n, r) {
    for(let s = 0; s <= n.length; s++){
        let o = s ? n[s - 1].to : e, l = s < n.length ? n[s].from : t, a = s ? 256 : r;
        for(let c = o, h = a, u = a; c < l; c++){
            let f = i0(i.charCodeAt(c));
            f == 512 ? f = h : f == 8 && u == 4 && (f = 16), oe[c] = f == 4 ? 2 : f, f & 7 && (u = f), h = f;
        }
        for(let c = o, h = a, u = a; c < l; c++){
            let f = oe[c];
            if (f == 128) c < l - 1 && h == oe[c + 1] && h & 24 ? f = oe[c] = h : oe[c] = 256;
            else if (f == 64) {
                let d = c + 1;
                for(; d < l && oe[d] == 64;)d++;
                let p = c && h == 8 || d < t && oe[d] == 8 ? u == 1 ? 1 : 8 : 256;
                for(let y = c; y < d; y++)oe[y] = p;
                c = d - 1;
            } else f == 8 && u == 1 && (oe[c] = 1);
            h = f, f & 7 && (u = f);
        }
    }
}
function s0(i, e, t, n, r) {
    let s = r == 1 ? 2 : 1;
    for(let o = 0, l = 0, a = 0; o <= n.length; o++){
        let c = o ? n[o - 1].to : e, h = o < n.length ? n[o].from : t;
        for(let u = c, f, d, p; u < h; u++)if (d = Ll[f = i.charCodeAt(u)]) {
            if (d < 0) {
                for(let y = l - 3; y >= 0; y -= 3)if (At[y + 1] == -d) {
                    let b = At[y + 2], k = b & 2 ? r : b & 4 ? b & 1 ? s : r : 0;
                    k && (oe[u] = oe[At[y]] = k), l = y;
                    break;
                }
            } else {
                if (At.length == 189) break;
                At[l++] = u, At[l++] = f, At[l++] = a;
            }
        } else if ((p = oe[u]) == 2 || p == 1) {
            let y = p == r;
            a = y ? 0 : 1;
            for(let b = l - 3; b >= 0; b -= 3){
                let k = At[b + 2];
                if (k & 2) break;
                if (y) At[b + 2] |= 2;
                else {
                    if (k & 4) break;
                    At[b + 2] |= 4;
                }
            }
        }
    }
}
function o0(i, e, t, n) {
    for(let r = 0, s = n; r <= t.length; r++){
        let o = r ? t[r - 1].to : i, l = r < t.length ? t[r].from : e;
        for(let a = o; a < l;){
            let c = oe[a];
            if (c == 256) {
                let h = a + 1;
                for(;;)if (h == l) {
                    if (r == t.length) break;
                    h = t[r++].to, l = r < t.length ? t[r].from : e;
                } else if (oe[h] == 256) h++;
                else break;
                let u = s == 1, f = (h < e ? oe[h] : n) == 1, d = u == f ? u ? 1 : 2 : n;
                for(let p = h, y = r, b = y ? t[y - 1].to : i; p > a;)p == b && (p = t[--y].from, b = y ? t[y - 1].to : i), oe[--p] = d;
                a = h;
            } else s = c, a++;
        }
    }
}
function Bl(i, e, t, n, r, s, o) {
    let l = n % 2 ? 2 : 1;
    if (n % 2 == r % 2) for(let a = e, c = 0; a < t;){
        let h = !0, u = !1;
        if (c == s.length || a < s[c].from) {
            let y = oe[a];
            y != l && (h = !1, u = y == 16);
        }
        let f = !h && l == 1 ? [] : null, d = h ? n : n + 1, p = a;
        e: for(;;)if (c < s.length && p == s[c].from) {
            if (u) break e;
            let y = s[c];
            if (!h) for(let b = y.to, k = c + 1;;){
                if (b == t) break e;
                if (k < s.length && s[k].from == b) b = s[k++].to;
                else {
                    if (oe[b] == l) break e;
                    break;
                }
            }
            if (c++, f) f.push(y);
            else {
                y.from > a && o.push(new mi(a, y.from, d));
                let b = y.direction == yr != !(d % 2);
                Il(i, b ? n + 1 : n, r, y.inner, y.from, y.to, o), a = y.to;
            }
            p = y.to;
        } else {
            if (p == t || (h ? oe[p] != l : oe[p] == l)) break;
            p++;
        }
        f ? Bl(i, a, p, n + 1, r, f, o) : a < p && o.push(new mi(a, p, d)), a = p;
    }
    else for(let a = t, c = s.length; a > e;){
        let h = !0, u = !1;
        if (!c || a > s[c - 1].to) {
            let y = oe[a - 1];
            y != l && (h = !1, u = y == 16);
        }
        let f = !h && l == 1 ? [] : null, d = h ? n : n + 1, p = a;
        e: for(;;)if (c && p == s[c - 1].to) {
            if (u) break e;
            let y = s[--c];
            if (!h) for(let b = y.from, k = c;;){
                if (b == e) break e;
                if (k && s[k - 1].to == b) b = s[--k].from;
                else {
                    if (oe[b - 1] == l) break e;
                    break;
                }
            }
            if (f) f.push(y);
            else {
                y.to < a && o.push(new mi(y.to, a, d));
                let b = y.direction == yr != !(d % 2);
                Il(i, b ? n + 1 : n, r, y.inner, y.from, y.to, o), a = y.from;
            }
            p = y.from;
        } else {
            if (p == e || (h ? oe[p - 1] != l : oe[p - 1] == l)) break;
            p--;
        }
        f ? Bl(i, p, a, n + 1, r, f, o) : p < a && o.push(new mi(p, a, d)), a = p;
    }
}
function Il(i, e, t, n, r, s, o) {
    let l = e % 2 ? 2 : 1;
    r0(i, r, s, n, l), s0(i, r, s, n, l), o0(r, s, n, l), Bl(i, r, s, e, t, n, o);
}
function l0(i, e, t) {
    if (!i) return [
        new mi(0, 0, e == sp ? 1 : 0)
    ];
    if (e == yr && !t.length && !n0.test(i)) return ap(i.length);
    if (t.length) for(; i.length > oe.length;)oe[oe.length] = 256;
    let n = [], r = e == yr ? 0 : 1;
    return Il(i, r, r, t, 0, i.length, n), n;
}
function ap(i) {
    return [
        new mi(0, i, 0)
    ];
}
let cp = "";
function a0(i, e, t, n, r) {
    var s;
    let o = n.head - i.from, l = -1;
    if (o == 0) {
        if (!r || !i.length) return null;
        e[0].level != t && (o = e[0].side(!1, t), l = 0);
    } else if (o == i.length) {
        if (r) return null;
        let f = e[e.length - 1];
        f.level != t && (o = f.side(!0, t), l = e.length - 1);
    }
    l < 0 && (l = mi.find(e, o, (s = n.bidiLevel) !== null && s !== void 0 ? s : -1, n.assoc));
    let a = e[l];
    o == a.side(r, t) && (a = e[l += r ? 1 : -1], o = a.side(!r, t));
    let c = r == (a.dir == t), h = Xe(i.text, o, c);
    if (cp = i.text.slice(Math.min(o, h), Math.max(o, h)), h != a.side(r, t)) return O.cursor(h + i.from, c ? -1 : 1, a.level);
    let u = l == (r ? e.length - 1 : 0) ? null : e[l + (r ? 1 : -1)];
    return !u && a.level != t ? O.cursor(r ? i.to : i.from, r ? -1 : 1, t) : u && u.level < a.level ? O.cursor(u.side(!r, t) + i.from, r ? 1 : -1, u.level) : O.cursor(h + i.from, r ? -1 : 1, a.level);
}
class dh extends fe {
    get length() {
        return this.view.state.doc.length;
    }
    constructor(e){
        super(), this.view = e, this.decorations = [], this.dynamicDecorationMap = [], this.domChanged = null, this.hasComposition = null, this.markedForComposition = new Set, this.minWidth = 0, this.minWidthFrom = 0, this.minWidthTo = 0, this.impreciseAnchor = null, this.impreciseHead = null, this.forceSelection = !1, this.lastUpdate = Date.now(), this.setDOM(e.contentDOM), this.children = [
            new Oe
        ], this.children[0].setParent(this), this.updateDeco(), this.updateInner([
            new ut(0, 0, 0, e.state.doc.length)
        ], 0, null);
    }
    update(e) {
        var t;
        let n = e.changedRanges;
        this.minWidth > 0 && n.length && (n.every(({ fromA: c, toA: h })=>h < this.minWidthFrom || c > this.minWidthTo) ? (this.minWidthFrom = e.changes.mapPos(this.minWidthFrom, 1), this.minWidthTo = e.changes.mapPos(this.minWidthTo, 1)) : this.minWidth = this.minWidthFrom = this.minWidthTo = 0);
        let r = -1;
        this.view.inputState.composing >= 0 && (!((t = this.domChanged) === null || t === void 0) && t.newSel ? r = this.domChanged.newSel.head : !g0(e.changes, this.hasComposition) && !e.selectionSet && (r = e.state.selection.main.head));
        let s = r > -1 ? h0(this.view, e.changes, r) : null;
        if (this.domChanged = null, this.hasComposition) {
            this.markedForComposition.clear();
            let { from: c, to: h } = this.hasComposition;
            n = new ut(c, h, e.changes.mapPos(c, -1), e.changes.mapPos(h, 1)).addToSet(n.slice());
        }
        this.hasComposition = s ? {
            from: s.range.fromB,
            to: s.range.toB
        } : null, (I.ie || I.chrome) && !s && e && e.state.doc.lines != e.startState.doc.lines && (this.forceSelection = !0);
        let o = this.decorations, l = this.updateDeco(), a = d0(o, l, e.changes);
        return n = ut.extendWithRanges(n, a), !(this.flags & 7) && n.length == 0 ? !1 : (this.updateInner(n, e.startState.doc.length, s), e.transactions.length && (this.lastUpdate = Date.now()), !0);
    }
    updateInner(e, t, n) {
        this.view.viewState.mustMeasureContent = !0, this.updateChildren(e, t, n);
        let { observer: r } = this.view;
        r.ignore(()=>{
            this.dom.style.height = this.view.viewState.contentHeight / this.view.scaleY + "px", this.dom.style.flexBasis = this.minWidth ? this.minWidth + "px" : "";
            let o = I.chrome || I.ios ? {
                node: r.selectionRange.focusNode,
                written: !1
            } : void 0;
            this.sync(this.view, o), this.flags &= -8, o && (o.written || r.selectionRange.focusNode != o.node) && (this.forceSelection = !0), this.dom.style.height = "";
        }), this.markedForComposition.forEach((o)=>o.flags &= -9);
        let s = [];
        if (this.view.viewport.from || this.view.viewport.to < this.view.state.doc.length) for (let o of this.children)o instanceof bi && o.widget instanceof ph && s.push(o.dom);
        r.updateGaps(s);
    }
    updateChildren(e, t, n) {
        let r = n ? n.range.addToSet(e.slice()) : e, s = this.childCursor(t);
        for(let o = r.length - 1;; o--){
            let l = o >= 0 ? r[o] : null;
            if (!l) break;
            let { fromA: a, toA: c, fromB: h, toB: u } = l, f, d, p, y;
            if (n && n.range.fromB < u && n.range.toB > h) {
                let S = ur.build(this.view.state.doc, h, n.range.fromB, this.decorations, this.dynamicDecorationMap), x = ur.build(this.view.state.doc, n.range.toB, u, this.decorations, this.dynamicDecorationMap);
                d = S.breakAtStart, p = S.openStart, y = x.openEnd;
                let R = this.compositionView(n);
                x.breakAtStart ? R.breakAfter = 1 : x.content.length && R.merge(R.length, R.length, x.content[0], !1, x.openStart, 0) && (R.breakAfter = x.content[0].breakAfter, x.content.shift()), S.content.length && R.merge(0, 0, S.content[S.content.length - 1], !0, 0, S.openEnd) && S.content.pop(), f = S.content.concat(R).concat(x.content);
            } else ({ content: f, breakAtStart: d, openStart: p, openEnd: y } = ur.build(this.view.state.doc, h, u, this.decorations, this.dynamicDecorationMap));
            let { i: b, off: k } = s.findPos(c, 1), { i: T, off: D } = s.findPos(a, -1);
            jd(this, T, D, b, k, f, d, p, y);
        }
        n && this.fixCompositionDOM(n);
    }
    compositionView(e) {
        let t = new ni(e.text.nodeValue);
        t.flags |= 8;
        for (let { deco: r } of e.marks)t = new ri(r, [
            t
        ], t.length);
        let n = new Oe;
        return n.append(t, 0), n;
    }
    fixCompositionDOM(e) {
        let t = (s, o)=>{
            o.flags |= 8 | (o.children.some((a)=>a.flags & 7) ? 1 : 0), this.markedForComposition.add(o);
            let l = fe.get(s);
            l && l != o && (l.dom = null), o.setDOM(s);
        }, n = this.childPos(e.range.fromB, 1), r = this.children[n.i];
        t(e.line, r);
        for(let s = e.marks.length - 1; s >= -1; s--)n = r.childPos(n.off, 1), r = r.children[n.i], t(s >= 0 ? e.marks[s].node : e.text, r);
    }
    updateSelection(e = !1, t = !1) {
        (e || !this.view.observer.selectionRange.focusNode) && this.view.observer.readSelectionRange();
        let n = this.view.root.activeElement, r = n == this.dom, s = !r && Ds(this.dom, this.view.observer.selectionRange) && !(n && this.dom.contains(n));
        if (!(r || t || s)) return;
        let o = this.forceSelection;
        this.forceSelection = !1;
        let l = this.view.state.selection.main, a = this.moveToLine(this.domAtPos(l.anchor)), c = l.empty ? a : this.moveToLine(this.domAtPos(l.head));
        if (I.gecko && l.empty && !this.hasComposition && c0(a)) {
            let u = document.createTextNode("");
            this.view.observer.ignore(()=>a.node.insertBefore(u, a.node.childNodes[a.offset] || null)), a = c = new He(u, 0), o = !0;
        }
        let h = this.view.observer.selectionRange;
        (o || !h.focusNode || !Hs(a.node, a.offset, h.anchorNode, h.anchorOffset) || !Hs(c.node, c.offset, h.focusNode, h.focusOffset)) && (this.view.observer.ignore(()=>{
            I.android && I.chrome && this.dom.contains(h.focusNode) && p0(h.focusNode, this.dom) && (this.dom.blur(), this.dom.focus({
                preventScroll: !0
            }));
            let u = Fs(this.view.root);
            if (u) {
                if (l.empty) {
                    if (I.gecko) {
                        let f = u0(a.node, a.offset);
                        if (f && f != 3) {
                            let d = up(a.node, a.offset, f == 1 ? 1 : -1);
                            d && (a = new He(d.node, d.offset));
                        }
                    }
                    u.collapse(a.node, a.offset), l.bidiLevel != null && u.caretBidiLevel !== void 0 && (u.caretBidiLevel = l.bidiLevel);
                } else if (u.extend) {
                    u.collapse(a.node, a.offset);
                    try {
                        u.extend(c.node, c.offset);
                    } catch  {}
                } else {
                    let f = document.createRange();
                    l.anchor > l.head && ([a, c] = [
                        c,
                        a
                    ]), f.setEnd(c.node, c.offset), f.setStart(a.node, a.offset), u.removeAllRanges(), u.addRange(f);
                }
            }
            s && this.view.root.activeElement == this.dom && (this.dom.blur(), n && n.focus());
        }), this.view.observer.setSelectionRange(a, c)), this.impreciseAnchor = a.precise ? null : new He(h.anchorNode, h.anchorOffset), this.impreciseHead = c.precise ? null : new He(h.focusNode, h.focusOffset);
    }
    enforceCursorAssoc() {
        if (this.hasComposition) return;
        let { view: e } = this, t = e.state.selection.main, n = Fs(e.root), { anchorNode: r, anchorOffset: s } = e.observer.selectionRange;
        if (!n || !t.empty || !t.assoc || !n.modify) return;
        let o = Oe.find(this, t.head);
        if (!o) return;
        let l = o.posAtStart;
        if (t.head == l || t.head == l + o.length) return;
        let a = this.coordsAt(t.head, -1), c = this.coordsAt(t.head, 1);
        if (!a || !c || a.bottom > c.top) return;
        let h = this.domAtPos(t.head + t.assoc);
        n.collapse(h.node, h.offset), n.modify("move", t.assoc < 0 ? "forward" : "backward", "lineboundary"), e.observer.readSelectionRange();
        let u = e.observer.selectionRange;
        e.docView.posFromDOM(u.anchorNode, u.anchorOffset) != t.from && n.collapse(r, s);
    }
    moveToLine(e) {
        let t = this.dom, n;
        if (e.node != t) return e;
        for(let r = e.offset; !n && r < t.childNodes.length; r++){
            let s = fe.get(t.childNodes[r]);
            s instanceof Oe && (n = s.domAtPos(0));
        }
        for(let r = e.offset - 1; !n && r >= 0; r--){
            let s = fe.get(t.childNodes[r]);
            s instanceof Oe && (n = s.domAtPos(s.length));
        }
        return n ? new He(n.node, n.offset, !0) : e;
    }
    nearest(e) {
        for(let t = e; t;){
            let n = fe.get(t);
            if (n && n.rootView == this) return n;
            t = t.parentNode;
        }
        return null;
    }
    posFromDOM(e, t) {
        let n = this.nearest(e);
        if (!n) throw new RangeError("Trying to find position for a DOM position outside of the document");
        return n.localPosFromDOM(e, t) + n.posAtStart;
    }
    domAtPos(e) {
        let { i: t, off: n } = this.childCursor().findPos(e, -1);
        for(; t < this.children.length - 1;){
            let r = this.children[t];
            if (n < r.length || r instanceof Oe) break;
            t++, n = 0;
        }
        return this.children[t].domAtPos(n);
    }
    coordsAt(e, t) {
        let n = null, r = 0;
        for(let s = this.length, o = this.children.length - 1; o >= 0; o--){
            let l = this.children[o], a = s - l.breakAfter, c = a - l.length;
            if (a < e) break;
            c <= e && (c < e || l.covers(-1)) && (a > e || l.covers(1)) && (!n || l instanceof Oe && !(n instanceof Oe && t >= 0)) && (n = l, r = c), s = c;
        }
        return n ? n.coordsAt(e - r, t) : null;
    }
    coordsForChar(e) {
        let { i: t, off: n } = this.childPos(e, 1), r = this.children[t];
        if (!(r instanceof Oe)) return null;
        for(; r.children.length;){
            let { i: l, off: a } = r.childPos(n, 1);
            for(;; l++){
                if (l == r.children.length) return null;
                if ((r = r.children[l]).length) break;
            }
            n = a;
        }
        if (!(r instanceof ni)) return null;
        let s = Xe(r.text, n);
        if (s == n) return null;
        let o = Ui(r.dom, n, s).getClientRects();
        for(let l = 0; l < o.length; l++){
            let a = o[l];
            if (l == o.length - 1 || a.top < a.bottom && a.left < a.right) return a;
        }
        return null;
    }
    measureVisibleLineHeights(e) {
        let t = [], { from: n, to: r } = e, s = this.view.contentDOM.clientWidth, o = s > Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1, l = -1, a = this.view.textDirection == ge.LTR;
        for(let c = 0, h = 0; h < this.children.length; h++){
            let u = this.children[h], f = c + u.length;
            if (f > r) break;
            if (c >= n) {
                let d = u.dom.getBoundingClientRect();
                if (t.push(d.height), o) {
                    let p = u.dom.lastChild, y = p ? gn(p) : [];
                    if (y.length) {
                        let b = y[y.length - 1], k = a ? b.right - d.left : d.right - b.left;
                        k > l && (l = k, this.minWidth = s, this.minWidthFrom = c, this.minWidthTo = f);
                    }
                }
            }
            c = f + u.breakAfter;
        }
        return t;
    }
    textDirectionAt(e) {
        let { i: t } = this.childPos(e, 1);
        return getComputedStyle(this.children[t].dom).direction == "rtl" ? ge.RTL : ge.LTR;
    }
    measureTextSize() {
        for (let s of this.children)if (s instanceof Oe) {
            let o = s.measureTextSize();
            if (o) return o;
        }
        let e = document.createElement("div"), t, n, r;
        return e.className = "cm-line", e.style.width = "99999px", e.style.position = "absolute", e.textContent = "abc def ghi jkl mno pqr stu", this.view.observer.ignore(()=>{
            this.dom.appendChild(e);
            let s = gn(e.firstChild)[0];
            t = e.getBoundingClientRect().height, n = s ? s.width / 27 : 7, r = s ? s.height : t, e.remove();
        }), {
            lineHeight: t,
            charWidth: n,
            textHeight: r
        };
    }
    childCursor(e = this.length) {
        let t = this.children.length;
        return t && (e -= this.children[--t].length), new qd(this.children, e, t);
    }
    computeBlockGapDeco() {
        let e = [], t = this.view.viewState;
        for(let n = 0, r = 0;; r++){
            let s = r == t.viewports.length ? null : t.viewports[r], o = s ? s.from - 1 : this.length;
            if (o > n) {
                let l = (t.lineBlockAt(o).bottom - t.lineBlockAt(n).top) / this.view.scaleY;
                e.push(ee.replace({
                    widget: new ph(l),
                    block: !0,
                    inclusive: !0,
                    isBlockGap: !0
                }).range(n, o));
            }
            if (!s) break;
            n = s.to + 1;
        }
        return ee.set(e);
    }
    updateDeco() {
        let e = this.view.state.facet(mr).map((t, n)=>(this.dynamicDecorationMap[n] = typeof t == "function") ? t(this.view) : t);
        for(let t = e.length; t < e.length + 3; t++)this.dynamicDecorationMap[t] = !1;
        return this.decorations = [
            ...e,
            this.computeBlockGapDeco(),
            this.view.viewState.lineGapDeco
        ];
    }
    scrollIntoView(e) {
        let { range: t } = e, n = this.coordsAt(t.head, t.empty ? t.assoc : t.head > t.anchor ? -1 : 1), r;
        if (!n) return;
        !t.empty && (r = this.coordsAt(t.anchor, t.anchor > t.head ? -1 : 1)) && (n = {
            left: Math.min(n.left, r.left),
            top: Math.min(n.top, r.top),
            right: Math.max(n.right, r.right),
            bottom: Math.max(n.bottom, r.bottom)
        });
        let s = rp(this.view), o = {
            left: n.left - s.left,
            top: n.top - s.top,
            right: n.right + s.right,
            bottom: n.bottom + s.bottom
        };
        Vm(this.view.scrollDOM, o, t.head < t.anchor ? -1 : 1, e.x, e.y, e.xMargin, e.yMargin, this.view.textDirection == ge.LTR);
    }
}
function c0(i) {
    return i.node.nodeType == 1 && i.node.firstChild && (i.offset == 0 || i.node.childNodes[i.offset - 1].contentEditable == "false") && (i.offset == i.node.childNodes.length || i.node.childNodes[i.offset].contentEditable == "false");
}
class ph extends li {
    constructor(e){
        super(), this.height = e;
    }
    toDOM() {
        let e = document.createElement("div");
        return this.updateDOM(e), e;
    }
    eq(e) {
        return e.height == this.height;
    }
    updateDOM(e) {
        return e.style.height = this.height + "px", !0;
    }
    get estimatedHeight() {
        return this.height;
    }
}
function hp(i, e) {
    let t = i.observer.selectionRange, n = t.focusNode && up(t.focusNode, t.focusOffset, 0);
    if (!n) return null;
    let r = e - n.offset;
    return {
        from: r,
        to: r + n.node.nodeValue.length,
        node: n.node
    };
}
function h0(i, e, t) {
    let n = hp(i, t);
    if (!n) return null;
    let { node: r, from: s, to: o } = n, l = r.nodeValue;
    if (/[\n\r]/.test(l) || i.state.doc.sliceString(n.from, n.to) != l) return null;
    let a = e.invertedDesc, c = new ut(a.mapPos(s), a.mapPos(o), s, o), h = [];
    for(let u = r.parentNode;; u = u.parentNode){
        let f = fe.get(u);
        if (f instanceof ri) h.push({
            node: u,
            deco: f.mark
        });
        else {
            if (f instanceof Oe || u.nodeName == "DIV" && u.parentNode == i.contentDOM) return {
                range: c,
                text: r,
                marks: h,
                line: u
            };
            if (u != i.contentDOM) h.push({
                node: u,
                deco: new _r({
                    inclusive: !0,
                    attributes: Ym(u),
                    tagName: u.tagName.toLowerCase()
                })
            });
            else return null;
        }
    }
}
function up(i, e, t) {
    if (t <= 0) for(let n = i, r = e;;){
        if (n.nodeType == 3) return {
            node: n,
            offset: r
        };
        if (n.nodeType == 1 && r > 0) n = n.childNodes[r - 1], r = ii(n);
        else break;
    }
    if (t >= 0) for(let n = i, r = e;;){
        if (n.nodeType == 3) return {
            node: n,
            offset: r
        };
        if (n.nodeType == 1 && r < n.childNodes.length && t >= 0) n = n.childNodes[r], r = 0;
        else break;
    }
    return null;
}
function u0(i, e) {
    return i.nodeType != 1 ? 0 : (e && i.childNodes[e - 1].contentEditable == "false" ? 1 : 0) | (e < i.childNodes.length && i.childNodes[e].contentEditable == "false" ? 2 : 0);
}
let f0 = class {
    constructor(){
        this.changes = [];
    }
    compareRange(e, t) {
        El(e, t, this.changes);
    }
    comparePoint(e, t) {
        El(e, t, this.changes);
    }
};
function d0(i, e, t) {
    let n = new f0;
    return le.compare(i, e, t, n), n.changes;
}
function p0(i, e) {
    for(let t = i; t && t != e; t = t.assignedSlot || t.parentNode)if (t.nodeType == 1 && t.contentEditable == "false") return !0;
    return !1;
}
function g0(i, e) {
    let t = !1;
    return e && i.iterChangedRanges((n, r)=>{
        n < e.to && r > e.from && (t = !0);
    }), t;
}
function m0(i, e, t = 1) {
    let n = i.charCategorizer(e), r = i.doc.lineAt(e), s = e - r.from;
    if (r.length == 0) return O.cursor(e);
    s == 0 ? t = 1 : s == r.length && (t = -1);
    let o = s, l = s;
    t < 0 ? o = Xe(r.text, s, !1) : l = Xe(r.text, s);
    let a = n(r.text.slice(o, l));
    for(; o > 0;){
        let c = Xe(r.text, o, !1);
        if (n(r.text.slice(c, o)) != a) break;
        o = c;
    }
    for(; l < r.length;){
        let c = Xe(r.text, l);
        if (n(r.text.slice(l, c)) != a) break;
        l = c;
    }
    return O.range(o + r.from, l + r.from);
}
function y0(i, e) {
    return e.left > i ? e.left - i : Math.max(0, i - e.right);
}
function b0(i, e) {
    return e.top > i ? e.top - i : Math.max(0, i - e.bottom);
}
function Uo(i, e) {
    return i.top < e.bottom - 1 && i.bottom > e.top + 1;
}
function gh(i, e) {
    return e < i.top ? {
        top: e,
        left: i.left,
        right: i.right,
        bottom: i.bottom
    } : i;
}
function mh(i, e) {
    return e > i.bottom ? {
        top: i.top,
        left: i.left,
        right: i.right,
        bottom: e
    } : i;
}
function ql(i, e, t) {
    let n, r, s, o, l = !1, a, c, h, u;
    for(let p = i.firstChild; p; p = p.nextSibling){
        let y = gn(p);
        for(let b = 0; b < y.length; b++){
            let k = y[b];
            r && Uo(r, k) && (k = gh(mh(k, r.bottom), r.top));
            let T = y0(e, k), D = b0(t, k);
            if (T == 0 && D == 0) return p.nodeType == 3 ? yh(p, e, t) : ql(p, e, t);
            if (!n || o > D || o == D && s > T) {
                n = p, r = k, s = T, o = D;
                let S = D ? t < k.top ? -1 : 1 : T ? e < k.left ? -1 : 1 : 0;
                l = !S || (S > 0 ? b < y.length - 1 : b > 0);
            }
            T == 0 ? t > k.bottom && (!h || h.bottom < k.bottom) ? (a = p, h = k) : t < k.top && (!u || u.top > k.top) && (c = p, u = k) : h && Uo(h, k) ? h = mh(h, k.bottom) : u && Uo(u, k) && (u = gh(u, k.top));
        }
    }
    if (h && h.bottom >= t ? (n = a, r = h) : u && u.top <= t && (n = c, r = u), !n) return {
        node: i,
        offset: 0
    };
    let f = Math.max(r.left, Math.min(r.right, e));
    if (n.nodeType == 3) return yh(n, f, t);
    if (l && n.contentEditable != "false") return ql(n, f, t);
    let d = Array.prototype.indexOf.call(i.childNodes, n) + (e >= (r.left + r.right) / 2 ? 1 : 0);
    return {
        node: i,
        offset: d
    };
}
function yh(i, e, t) {
    let n = i.nodeValue.length, r = -1, s = 1e9, o = 0;
    for(let l = 0; l < n; l++){
        let a = Ui(i, l, l + 1).getClientRects();
        for(let c = 0; c < a.length; c++){
            let h = a[c];
            if (h.top == h.bottom) continue;
            o || (o = e - h.left);
            let u = (h.top > t ? h.top - t : t - h.bottom) - 1;
            if (h.left - 1 <= e && h.right + 1 >= e && u < s) {
                let f = e >= (h.left + h.right) / 2, d = f;
                if ((I.chrome || I.gecko) && Ui(i, l).getBoundingClientRect().left == h.right && (d = !f), u <= 0) return {
                    node: i,
                    offset: l + (d ? 1 : 0)
                };
                r = l + (d ? 1 : 0), s = u;
            }
        }
    }
    return {
        node: i,
        offset: r > -1 ? r : o > 0 ? i.nodeValue.length : 0
    };
}
function fp(i, e, t, n = -1) {
    var r, s;
    let o = i.contentDOM.getBoundingClientRect(), l = o.top + i.viewState.paddingTop, a, { docHeight: c } = i.viewState, { x: h, y: u } = e, f = u - l;
    if (f < 0) return 0;
    if (f > c) return i.state.doc.length;
    for(let S = i.viewState.heightOracle.textHeight / 2, x = !1; a = i.elementAtHeight(f), a.type != Ke.Text;)for(; f = n > 0 ? a.bottom + S : a.top - S, !(f >= 0 && f <= c);){
        if (x) return t ? null : 0;
        x = !0, n = -n;
    }
    u = l + f;
    let d = a.from;
    if (d < i.viewport.from) return i.viewport.from == 0 ? 0 : t ? null : bh(i, o, a, h, u);
    if (d > i.viewport.to) return i.viewport.to == i.state.doc.length ? i.state.doc.length : t ? null : bh(i, o, a, h, u);
    let p = i.dom.ownerDocument, y = i.root.elementFromPoint ? i.root : p, b = y.elementFromPoint(h, u);
    b && !i.contentDOM.contains(b) && (b = null), b || (h = Math.max(o.left + 1, Math.min(o.right - 1, h)), b = y.elementFromPoint(h, u), b && !i.contentDOM.contains(b) && (b = null));
    let k, T = -1;
    if (b && ((r = i.docView.nearest(b)) === null || r === void 0 ? void 0 : r.isEditable) != !1) {
        if (p.caretPositionFromPoint) {
            let S = p.caretPositionFromPoint(h, u);
            S && ({ offsetNode: k, offset: T } = S);
        } else if (p.caretRangeFromPoint) {
            let S = p.caretRangeFromPoint(h, u);
            S && ({ startContainer: k, startOffset: T } = S, (!i.contentDOM.contains(k) || I.safari && v0(k, T, h) || I.chrome && w0(k, T, h)) && (k = void 0));
        }
    }
    if (!k || !i.docView.dom.contains(k)) {
        let S = Oe.find(i.docView, d);
        if (!S) return f > a.top + a.height / 2 ? a.to : a.from;
        ({ node: k, offset: T } = ql(S.dom, h, u));
    }
    let D = i.docView.nearest(k);
    if (!D) return null;
    if (D.isWidget && ((s = D.dom) === null || s === void 0 ? void 0 : s.nodeType) == 1) {
        let S = D.dom.getBoundingClientRect();
        return e.y < S.top || e.y <= S.bottom && e.x <= (S.left + S.right) / 2 ? D.posAtStart : D.posAtEnd;
    } else return D.localPosFromDOM(k, T) + D.posAtStart;
}
function bh(i, e, t, n, r) {
    let s = Math.round((n - e.left) * i.defaultCharacterWidth);
    if (i.lineWrapping && t.height > i.defaultLineHeight * 1.5) {
        let l = i.viewState.heightOracle.textHeight, a = Math.floor((r - t.top - (i.defaultLineHeight - l) * .5) / l);
        s += a * i.viewState.heightOracle.lineLength;
    }
    let o = i.state.sliceDoc(t.from, t.to);
    return t.from + Bm(o, s, i.state.tabSize);
}
function v0(i, e, t) {
    let n;
    if (i.nodeType != 3 || e != (n = i.nodeValue.length)) return !1;
    for(let r = i.nextSibling; r; r = r.nextSibling)if (r.nodeType != 1 || r.nodeName != "BR") return !1;
    return Ui(i, n - 1, n).getBoundingClientRect().left > t;
}
function w0(i, e, t) {
    if (e != 0) return !1;
    for(let r = i;;){
        let s = r.parentNode;
        if (!s || s.nodeType != 1 || s.firstChild != r) return !1;
        if (s.classList.contains("cm-line")) break;
        r = s;
    }
    let n = i.nodeType == 1 ? i.getBoundingClientRect() : Ui(i, 0, Math.max(i.nodeValue.length, 1)).getBoundingClientRect();
    return t - n.left > 5;
}
function jl(i, e) {
    let t = i.lineBlockAt(e);
    if (Array.isArray(t.type)) {
        for (let n of t.type)if (n.to > e || n.to == e && (n.to == t.to || n.type == Ke.Text)) return n;
    }
    return t;
}
function k0(i, e, t, n) {
    let r = jl(i, e.head), s = !n || r.type != Ke.Text || !(i.lineWrapping || r.widgetLineBreaks) ? null : i.coordsAtPos(e.assoc < 0 && e.head > r.from ? e.head - 1 : e.head);
    if (s) {
        let o = i.dom.getBoundingClientRect(), l = i.textDirectionAt(r.from), a = i.posAtCoords({
            x: t == (l == ge.LTR) ? o.right - 1 : o.left + 1,
            y: (s.top + s.bottom) / 2
        });
        if (a != null) return O.cursor(a, t ? -1 : 1);
    }
    return O.cursor(t ? r.to : r.from, t ? -1 : 1);
}
function vh(i, e, t, n) {
    let r = i.state.doc.lineAt(e.head), s = i.bidiSpans(r), o = i.textDirectionAt(r.from);
    for(let l = e, a = null;;){
        let c = a0(r, s, o, l, t), h = cp;
        if (!c) {
            if (r.number == (t ? i.state.doc.lines : 1)) return l;
            h = `
`, r = i.state.doc.line(r.number + (t ? 1 : -1)), s = i.bidiSpans(r), c = O.cursor(t ? r.from : r.to);
        }
        if (a) {
            if (!a(h)) return l;
        } else {
            if (!n) return c;
            a = n(h);
        }
        l = c;
    }
}
function S0(i, e, t) {
    let n = i.state.charCategorizer(e), r = n(t);
    return (s)=>{
        let o = n(s);
        return r == ei.Space && (r = o), r == o;
    };
}
function C0(i, e, t, n) {
    let r = e.head, s = t ? 1 : -1;
    if (r == (t ? i.state.doc.length : 0)) return O.cursor(r, e.assoc);
    let o = e.goalColumn, l, a = i.contentDOM.getBoundingClientRect(), c = i.coordsAtPos(r, e.assoc || -1), h = i.documentTop;
    if (c) o == null && (o = c.left - a.left), l = s < 0 ? c.top : c.bottom;
    else {
        let d = i.viewState.lineBlockAt(r);
        o == null && (o = Math.min(a.right - a.left, i.defaultCharacterWidth * (r - d.from))), l = (s < 0 ? d.top : d.bottom) + h;
    }
    let u = a.left + o, f = n ?? i.viewState.heightOracle.textHeight >> 1;
    for(let d = 0;; d += 10){
        let p = l + (f + d) * s, y = fp(i, {
            x: u,
            y: p
        }, !1, s);
        if (p < a.top || p > a.bottom || (s < 0 ? y < r : y > r)) {
            let b = i.docView.coordsForChar(y), k = !b || p < b.top ? -1 : 1;
            return O.cursor(y, k, void 0, o);
        }
    }
}
function Ps(i, e, t) {
    for(;;){
        let n = 0;
        for (let r of i)r.between(e - 1, e + 1, (s, o, l)=>{
            if (e > s && e < o) {
                let a = n || t || (e - s < o - e ? -1 : 1);
                e = a < 0 ? s : o, n = a;
            }
        });
        if (!n) return e;
    }
}
function Ko(i, e, t) {
    let n = Ps(i.state.facet(mc).map((r)=>r(i)), t.from, e.head > t.from ? -1 : 1);
    return n == t.from ? t : O.cursor(n, n < t.from ? 1 : -1);
}
class T0 {
    setSelectionOrigin(e) {
        this.lastSelectionOrigin = e, this.lastSelectionTime = Date.now();
    }
    constructor(e){
        this.view = e, this.lastKeyCode = 0, this.lastKeyTime = 0, this.lastTouchTime = 0, this.lastFocusTime = 0, this.lastScrollTop = 0, this.lastScrollLeft = 0, this.pendingIOSKey = void 0, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastEscPress = 0, this.lastContextMenu = 0, this.scrollHandlers = [], this.handlers = Object.create(null), this.composing = -1, this.compositionFirstChange = null, this.compositionEndedAt = 0, this.compositionPendingKey = !1, this.compositionPendingChange = !1, this.mouseSelection = null, this.handleEvent = this.handleEvent.bind(this), this.notifiedFocused = e.hasFocus, I.safari && e.contentDOM.addEventListener("input", ()=>null), I.gecko && F0(e.contentDOM.ownerDocument);
    }
    handleEvent(e) {
        !_0(this.view, e) || this.ignoreDuringComposition(e) || e.type == "keydown" && this.keydown(e) || this.runHandlers(e.type, e);
    }
    runHandlers(e, t) {
        let n = this.handlers[e];
        if (n) {
            for (let r of n.observers)r(this.view, t);
            for (let r of n.handlers){
                if (t.defaultPrevented) break;
                if (r(this.view, t)) {
                    t.preventDefault();
                    break;
                }
            }
        }
    }
    ensureHandlers(e) {
        let t = x0(e), n = this.handlers, r = this.view.contentDOM;
        for(let s in t)if (s != "scroll") {
            let o = !t[s].handlers.length, l = n[s];
            l && o != !l.handlers.length && (r.removeEventListener(s, this.handleEvent), l = null), l || r.addEventListener(s, this.handleEvent, {
                passive: o
            });
        }
        for(let s in n)s != "scroll" && !t[s] && r.removeEventListener(s, this.handleEvent);
        this.handlers = t;
    }
    keydown(e) {
        if (this.lastKeyCode = e.keyCode, this.lastKeyTime = Date.now(), e.keyCode == 9 && Date.now() < this.lastEscPress + 2e3) return !0;
        if (e.keyCode != 27 && pp.indexOf(e.keyCode) < 0 && (this.view.inputState.lastEscPress = 0), I.android && I.chrome && !e.synthetic && (e.keyCode == 13 || e.keyCode == 8)) return this.view.observer.delayAndroidKey(e.key, e.keyCode), !0;
        let t;
        return I.ios && !e.synthetic && !e.altKey && !e.metaKey && ((t = dp.find((n)=>n.keyCode == e.keyCode)) && !e.ctrlKey || R0.indexOf(e.key) > -1 && e.ctrlKey && !e.shiftKey) ? (this.pendingIOSKey = t || e, setTimeout(()=>this.flushIOSKey(), 250), !0) : (e.keyCode != 229 && this.view.observer.forceFlush(), !1);
    }
    flushIOSKey() {
        let e = this.pendingIOSKey;
        return e ? (this.pendingIOSKey = void 0, un(this.view.contentDOM, e.key, e.keyCode)) : !1;
    }
    ignoreDuringComposition(e) {
        return /^key/.test(e.type) ? this.composing > 0 ? !0 : I.safari && !I.ios && this.compositionPendingKey && Date.now() - this.compositionEndedAt < 100 ? (this.compositionPendingKey = !1, !0) : !1 : !1;
    }
    startMouseSelection(e) {
        this.mouseSelection && this.mouseSelection.destroy(), this.mouseSelection = e;
    }
    update(e) {
        this.mouseSelection && this.mouseSelection.update(e), e.transactions.length && (this.lastKeyCode = this.lastSelectionTime = 0);
    }
    destroy() {
        this.mouseSelection && this.mouseSelection.destroy();
    }
}
function wh(i, e) {
    return (t, n)=>{
        try {
            return e.call(i, n, t);
        } catch (r) {
            Tt(t.state, r);
        }
    };
}
function x0(i) {
    let e = Object.create(null);
    function t(n) {
        return e[n] || (e[n] = {
            observers: [],
            handlers: []
        });
    }
    for (let n of i){
        let r = n.spec;
        if (r && r.domEventHandlers) for(let s in r.domEventHandlers){
            let o = r.domEventHandlers[s];
            o && t(s).handlers.push(wh(n.value, o));
        }
        if (r && r.domEventObservers) for(let s in r.domEventObservers){
            let o = r.domEventObservers[s];
            o && t(s).observers.push(wh(n.value, o));
        }
    }
    for(let n in Vt)t(n).handlers.push(Vt[n]);
    for(let n in xt)t(n).observers.push(xt[n]);
    return e;
}
const dp = [
    {
        key: "Backspace",
        keyCode: 8,
        inputType: "deleteContentBackward"
    },
    {
        key: "Enter",
        keyCode: 13,
        inputType: "insertParagraph"
    },
    {
        key: "Enter",
        keyCode: 13,
        inputType: "insertLineBreak"
    },
    {
        key: "Delete",
        keyCode: 46,
        inputType: "deleteContentForward"
    }
], R0 = "dthko", pp = [
    16,
    17,
    18,
    20,
    91,
    92,
    224,
    225
], as = 6;
function cs(i) {
    return Math.max(0, i) * .7 + 8;
}
function O0(i, e) {
    return Math.max(Math.abs(i.clientX - e.clientX), Math.abs(i.clientY - e.clientY));
}
class D0 {
    constructor(e, t, n, r){
        this.view = e, this.startEvent = t, this.style = n, this.mustSelect = r, this.scrollSpeed = {
            x: 0,
            y: 0
        }, this.scrolling = -1, this.lastEvent = t, this.scrollParent = $m(e.contentDOM), this.atoms = e.state.facet(mc).map((o)=>o(e));
        let s = e.contentDOM.ownerDocument;
        s.addEventListener("mousemove", this.move = this.move.bind(this)), s.addEventListener("mouseup", this.up = this.up.bind(this)), this.extend = t.shiftKey, this.multiple = e.state.facet(ie.allowMultipleSelections) && P0(e, t), this.dragging = A0(e, t) && bp(t) == 1 ? null : !1;
    }
    start(e) {
        this.dragging === !1 && this.select(e);
    }
    move(e) {
        var t;
        if (e.buttons == 0) return this.destroy();
        if (this.dragging || this.dragging == null && O0(this.startEvent, e) < 10) return;
        this.select(this.lastEvent = e);
        let n = 0, r = 0, s = ((t = this.scrollParent) === null || t === void 0 ? void 0 : t.getBoundingClientRect()) || {
            left: 0,
            top: 0,
            right: this.view.win.innerWidth,
            bottom: this.view.win.innerHeight
        }, o = rp(this.view);
        e.clientX - o.left <= s.left + as ? n = -cs(s.left - e.clientX) : e.clientX + o.right >= s.right - as && (n = cs(e.clientX - s.right)), e.clientY - o.top <= s.top + as ? r = -cs(s.top - e.clientY) : e.clientY + o.bottom >= s.bottom - as && (r = cs(e.clientY - s.bottom)), this.setScrollSpeed(n, r);
    }
    up(e) {
        this.dragging == null && this.select(this.lastEvent), this.dragging || e.preventDefault(), this.destroy();
    }
    destroy() {
        this.setScrollSpeed(0, 0);
        let e = this.view.contentDOM.ownerDocument;
        e.removeEventListener("mousemove", this.move), e.removeEventListener("mouseup", this.up), this.view.inputState.mouseSelection = null;
    }
    setScrollSpeed(e, t) {
        this.scrollSpeed = {
            x: e,
            y: t
        }, e || t ? this.scrolling < 0 && (this.scrolling = setInterval(()=>this.scroll(), 50)) : this.scrolling > -1 && (clearInterval(this.scrolling), this.scrolling = -1);
    }
    scroll() {
        this.scrollParent ? (this.scrollParent.scrollLeft += this.scrollSpeed.x, this.scrollParent.scrollTop += this.scrollSpeed.y) : this.view.win.scrollBy(this.scrollSpeed.x, this.scrollSpeed.y), this.dragging === !1 && this.select(this.lastEvent);
    }
    skipAtoms(e) {
        let t = null;
        for(let n = 0; n < e.ranges.length; n++){
            let r = e.ranges[n], s = null;
            if (r.empty) {
                let o = Ps(this.atoms, r.from, 0);
                o != r.from && (s = O.cursor(o, -1));
            } else {
                let o = Ps(this.atoms, r.from, -1), l = Ps(this.atoms, r.to, 1);
                (o != r.from || l != r.to) && (s = O.range(r.from == r.anchor ? o : l, r.from == r.head ? o : l));
            }
            s && (t || (t = e.ranges.slice()), t[n] = s);
        }
        return t ? O.create(t, e.mainIndex) : e;
    }
    select(e) {
        let { view: t } = this, n = this.skipAtoms(this.style.get(e, this.extend, this.multiple));
        (this.mustSelect || !n.eq(t.state.selection) || n.main.assoc != t.state.selection.main.assoc && this.dragging === !1) && this.view.dispatch({
            selection: n,
            userEvent: "select.pointer"
        }), this.mustSelect = !1;
    }
    update(e) {
        e.docChanged && this.dragging && (this.dragging = this.dragging.map(e.changes)), this.style.update(e) && setTimeout(()=>this.select(this.lastEvent), 20);
    }
}
function P0(i, e) {
    let t = i.state.facet(Kd);
    return t.length ? t[0](e) : I.mac ? e.metaKey : e.ctrlKey;
}
function M0(i, e) {
    let t = i.state.facet(Gd);
    return t.length ? t[0](e) : I.mac ? !e.altKey : !e.ctrlKey;
}
function A0(i, e) {
    let { main: t } = i.state.selection;
    if (t.empty) return !1;
    let n = Fs(i.root);
    if (!n || n.rangeCount == 0) return !0;
    let r = n.getRangeAt(0).getClientRects();
    for(let s = 0; s < r.length; s++){
        let o = r[s];
        if (o.left <= e.clientX && o.right >= e.clientX && o.top <= e.clientY && o.bottom >= e.clientY) return !0;
    }
    return !1;
}
function _0(i, e) {
    if (!e.bubbles) return !0;
    if (e.defaultPrevented) return !1;
    for(let t = e.target, n; t != i.contentDOM; t = t.parentNode)if (!t || t.nodeType == 11 || (n = fe.get(t)) && n.ignoreEvent(e)) return !1;
    return !0;
}
const Vt = Object.create(null), xt = Object.create(null), gp = I.ie && I.ie_version < 15 || I.ios && I.webkit_version < 604;
function E0(i) {
    let e = i.dom.parentNode;
    if (!e) return;
    let t = e.appendChild(document.createElement("textarea"));
    t.style.cssText = "position: fixed; left: -10000px; top: 10px", t.focus(), setTimeout(()=>{
        i.focus(), t.remove(), mp(i, t.value);
    }, 50);
}
function mp(i, e) {
    let { state: t } = i, n, r = 1, s = t.toText(e), o = s.lines == t.selection.ranges.length;
    if (Fl != null && t.selection.ranges.every((a)=>a.empty) && Fl == s.toString()) {
        let a = -1;
        n = t.changeByRange((c)=>{
            let h = t.doc.lineAt(c.from);
            if (h.from == a) return {
                range: c
            };
            a = h.from;
            let u = t.toText((o ? s.line(r++).text : e) + t.lineBreak);
            return {
                changes: {
                    from: h.from,
                    insert: u
                },
                range: O.cursor(c.from + u.length)
            };
        });
    } else o ? n = t.changeByRange((a)=>{
        let c = s.line(r++);
        return {
            changes: {
                from: a.from,
                to: a.to,
                insert: c.text
            },
            range: O.cursor(a.from + c.length)
        };
    }) : n = t.replaceSelection(s);
    i.dispatch(n, {
        userEvent: "input.paste",
        scrollIntoView: !0
    });
}
xt.scroll = (i)=>{
    i.inputState.lastScrollTop = i.scrollDOM.scrollTop, i.inputState.lastScrollLeft = i.scrollDOM.scrollLeft;
};
Vt.keydown = (i, e)=>(i.inputState.setSelectionOrigin("select"), e.keyCode == 27 && (i.inputState.lastEscPress = Date.now()), !1);
xt.touchstart = (i, e)=>{
    i.inputState.lastTouchTime = Date.now(), i.inputState.setSelectionOrigin("select.pointer");
};
xt.touchmove = (i)=>{
    i.inputState.setSelectionOrigin("select.pointer");
};
Vt.mousedown = (i, e)=>{
    if (i.observer.flush(), i.inputState.lastTouchTime > Date.now() - 2e3) return !1;
    let t = null;
    for (let n of i.state.facet(Jd))if (t = n(i, e), t) break;
    if (!t && e.button == 0 && (t = B0(i, e)), t) {
        let n = !i.hasFocus;
        i.inputState.startMouseSelection(new D0(i, e, t, n)), n && i.observer.ignore(()=>Ld(i.contentDOM));
        let r = i.inputState.mouseSelection;
        if (r) return r.start(e), r.dragging === !1;
    }
    return !1;
};
function kh(i, e, t, n) {
    if (n == 1) return O.cursor(e, t);
    if (n == 2) return m0(i.state, e, t);
    {
        let r = Oe.find(i.docView, e), s = i.state.doc.lineAt(r ? r.posAtEnd : e), o = r ? r.posAtStart : s.from, l = r ? r.posAtEnd : s.to;
        return l < i.state.doc.length && l == s.to && l++, O.range(o, l);
    }
}
let yp = (i, e)=>i >= e.top && i <= e.bottom, Sh = (i, e, t)=>yp(e, t) && i >= t.left && i <= t.right;
function N0(i, e, t, n) {
    let r = Oe.find(i.docView, e);
    if (!r) return 1;
    let s = e - r.posAtStart;
    if (s == 0) return 1;
    if (s == r.length) return -1;
    let o = r.coordsAt(s, -1);
    if (o && Sh(t, n, o)) return -1;
    let l = r.coordsAt(s, 1);
    return l && Sh(t, n, l) ? 1 : o && yp(n, o) ? -1 : 1;
}
function Ch(i, e) {
    let t = i.posAtCoords({
        x: e.clientX,
        y: e.clientY
    }, !1);
    return {
        pos: t,
        bias: N0(i, t, e.clientX, e.clientY)
    };
}
const L0 = I.ie && I.ie_version <= 11;
let Th = null, xh = 0, Rh = 0;
function bp(i) {
    if (!L0) return i.detail;
    let e = Th, t = Rh;
    return Th = i, Rh = Date.now(), xh = !e || t > Date.now() - 400 && Math.abs(e.clientX - i.clientX) < 2 && Math.abs(e.clientY - i.clientY) < 2 ? (xh + 1) % 3 : 1;
}
function B0(i, e) {
    let t = Ch(i, e), n = bp(e), r = i.state.selection;
    return {
        update (s) {
            s.docChanged && (t.pos = s.changes.mapPos(t.pos), r = r.map(s.changes));
        },
        get (s, o, l) {
            let a = Ch(i, s), c, h = kh(i, a.pos, a.bias, n);
            if (t.pos != a.pos && !o) {
                let u = kh(i, t.pos, t.bias, n), f = Math.min(u.from, h.from), d = Math.max(u.to, h.to);
                h = f < h.from ? O.range(f, d) : O.range(d, f);
            }
            return o ? r.replaceRange(r.main.extend(h.from, h.to)) : l && n == 1 && r.ranges.length > 1 && (c = I0(r, a.pos)) ? c : l ? r.addRange(h) : O.create([
                h
            ]);
        }
    };
}
function I0(i, e) {
    for(let t = 0; t < i.ranges.length; t++){
        let { from: n, to: r } = i.ranges[t];
        if (n <= e && r >= e) return O.create(i.ranges.slice(0, t).concat(i.ranges.slice(t + 1)), i.mainIndex == t ? 0 : i.mainIndex - (i.mainIndex > t ? 1 : 0));
    }
    return null;
}
Vt.dragstart = (i, e)=>{
    let { selection: { main: t } } = i.state, { mouseSelection: n } = i.inputState;
    return n && (n.dragging = t), e.dataTransfer && (e.dataTransfer.setData("Text", i.state.sliceDoc(t.from, t.to)), e.dataTransfer.effectAllowed = "copyMove"), !1;
};
function Oh(i, e, t, n) {
    if (!t) return;
    let r = i.posAtCoords({
        x: e.clientX,
        y: e.clientY
    }, !1), { mouseSelection: s } = i.inputState, o = n && s && s.dragging && M0(i, e) ? {
        from: s.dragging.from,
        to: s.dragging.to
    } : null, l = {
        from: r,
        insert: t
    }, a = i.state.changes(o ? [
        o,
        l
    ] : l);
    i.focus(), i.dispatch({
        changes: a,
        selection: {
            anchor: a.mapPos(r, -1),
            head: a.mapPos(r, 1)
        },
        userEvent: o ? "move.drop" : "input.drop"
    });
}
Vt.drop = (i, e)=>{
    if (!e.dataTransfer) return !1;
    if (i.state.readOnly) return !0;
    let t = e.dataTransfer.files;
    if (t && t.length) {
        let n = Array(t.length), r = 0, s = ()=>{
            ++r == t.length && Oh(i, e, n.filter((o)=>o != null).join(i.state.lineBreak), !1);
        };
        for(let o = 0; o < t.length; o++){
            let l = new FileReader;
            l.onerror = s, l.onload = ()=>{
                /[\x00-\x08\x0e-\x1f]{2}/.test(l.result) || (n[o] = l.result), s();
            }, l.readAsText(t[o]);
        }
        return !0;
    } else {
        let n = e.dataTransfer.getData("Text");
        if (n) return Oh(i, e, n, !0), !0;
    }
    return !1;
};
Vt.paste = (i, e)=>{
    if (i.state.readOnly) return !0;
    i.observer.flush();
    let t = gp ? null : e.clipboardData;
    return t ? (mp(i, t.getData("text/plain") || t.getData("text/uri-text")), !0) : (E0(i), !1);
};
function q0(i, e) {
    let t = i.dom.parentNode;
    if (!t) return;
    let n = t.appendChild(document.createElement("textarea"));
    n.style.cssText = "position: fixed; left: -10000px; top: 10px", n.value = e, n.focus(), n.selectionEnd = e.length, n.selectionStart = 0, setTimeout(()=>{
        n.remove(), i.focus();
    }, 50);
}
function j0(i) {
    let e = [], t = [], n = !1;
    for (let r of i.selection.ranges)r.empty || (e.push(i.sliceDoc(r.from, r.to)), t.push(r));
    if (!e.length) {
        let r = -1;
        for (let { from: s } of i.selection.ranges){
            let o = i.doc.lineAt(s);
            o.number > r && (e.push(o.text), t.push({
                from: o.from,
                to: Math.min(i.doc.length, o.to + 1)
            })), r = o.number;
        }
        n = !0;
    }
    return {
        text: e.join(i.lineBreak),
        ranges: t,
        linewise: n
    };
}
let Fl = null;
Vt.copy = Vt.cut = (i, e)=>{
    let { text: t, ranges: n, linewise: r } = j0(i.state);
    if (!t && !r) return !1;
    Fl = r ? t : null, e.type == "cut" && !i.state.readOnly && i.dispatch({
        changes: n,
        scrollIntoView: !0,
        userEvent: "delete.cut"
    });
    let s = gp ? null : e.clipboardData;
    return s ? (s.clearData(), s.setData("text/plain", t), !0) : (q0(i, t), !1);
};
const vp = oi.define();
function wp(i, e) {
    let t = [];
    for (let n of i.facet(Xd)){
        let r = n(i, e);
        r && t.push(r);
    }
    return t ? i.update({
        effects: t,
        annotations: vp.of(!0)
    }) : null;
}
function kp(i) {
    setTimeout(()=>{
        let e = i.hasFocus;
        if (e != i.inputState.notifiedFocused) {
            let t = wp(i.state, e);
            t ? i.dispatch(t) : i.update([]);
        }
    }, 10);
}
xt.focus = (i)=>{
    i.inputState.lastFocusTime = Date.now(), !i.scrollDOM.scrollTop && (i.inputState.lastScrollTop || i.inputState.lastScrollLeft) && (i.scrollDOM.scrollTop = i.inputState.lastScrollTop, i.scrollDOM.scrollLeft = i.inputState.lastScrollLeft), kp(i);
};
xt.blur = (i)=>{
    i.observer.clearSelectionRange(), kp(i);
};
xt.compositionstart = xt.compositionupdate = (i)=>{
    i.inputState.compositionFirstChange == null && (i.inputState.compositionFirstChange = !0), i.inputState.composing < 0 && (i.inputState.composing = 0);
};
xt.compositionend = (i)=>{
    i.inputState.composing = -1, i.inputState.compositionEndedAt = Date.now(), i.inputState.compositionPendingKey = !0, i.inputState.compositionPendingChange = i.observer.pendingRecords().length > 0, i.inputState.compositionFirstChange = null, I.chrome && I.android ? i.observer.flushSoon() : i.inputState.compositionPendingChange ? Promise.resolve().then(()=>i.observer.flush()) : setTimeout(()=>{
        i.inputState.composing < 0 && i.docView.hasComposition && i.update([]);
    }, 50);
};
xt.contextmenu = (i)=>{
    i.inputState.lastContextMenu = Date.now();
};
Vt.beforeinput = (i, e)=>{
    var t;
    let n;
    if (I.chrome && I.android && (n = dp.find((r)=>r.inputType == e.inputType)) && (i.observer.delayAndroidKey(n.key, n.keyCode), n.key == "Backspace" || n.key == "Delete")) {
        let r = ((t = window.visualViewport) === null || t === void 0 ? void 0 : t.height) || 0;
        setTimeout(()=>{
            var s;
            (((s = window.visualViewport) === null || s === void 0 ? void 0 : s.height) || 0) > r + 10 && i.hasFocus && (i.contentDOM.blur(), i.focus());
        }, 100);
    }
    return !1;
};
const Dh = new Set;
function F0(i) {
    Dh.has(i) || (Dh.add(i), i.addEventListener("copy", ()=>{}), i.addEventListener("cut", ()=>{}));
}
const Ph = [
    "pre-wrap",
    "normal",
    "pre-line",
    "break-spaces"
];
class H0 {
    constructor(e){
        this.lineWrapping = e, this.doc = X.empty, this.heightSamples = {}, this.lineHeight = 14, this.charWidth = 7, this.textHeight = 14, this.lineLength = 30, this.heightChanged = !1;
    }
    heightForGap(e, t) {
        let n = this.doc.lineAt(t).number - this.doc.lineAt(e).number + 1;
        return this.lineWrapping && (n += Math.max(0, Math.ceil((t - e - n * this.lineLength * .5) / this.lineLength))), this.lineHeight * n;
    }
    heightForLine(e) {
        return this.lineWrapping ? (1 + Math.max(0, Math.ceil((e - this.lineLength) / (this.lineLength - 5)))) * this.lineHeight : this.lineHeight;
    }
    setDoc(e) {
        return this.doc = e, this;
    }
    mustRefreshForWrapping(e) {
        return Ph.indexOf(e) > -1 != this.lineWrapping;
    }
    mustRefreshForHeights(e) {
        let t = !1;
        for(let n = 0; n < e.length; n++){
            let r = e[n];
            r < 0 ? n++ : this.heightSamples[Math.floor(r * 10)] || (t = !0, this.heightSamples[Math.floor(r * 10)] = !0);
        }
        return t;
    }
    refresh(e, t, n, r, s, o) {
        let l = Ph.indexOf(e) > -1, a = Math.round(t) != Math.round(this.lineHeight) || this.lineWrapping != l;
        if (this.lineWrapping = l, this.lineHeight = t, this.charWidth = n, this.textHeight = r, this.lineLength = s, a) {
            this.heightSamples = {};
            for(let c = 0; c < o.length; c++){
                let h = o[c];
                h < 0 ? c++ : this.heightSamples[Math.floor(h * 10)] = !0;
            }
        }
        return a;
    }
}
class W0 {
    constructor(e, t){
        this.from = e, this.heights = t, this.index = 0;
    }
    get more() {
        return this.index < this.heights.length;
    }
}
class It {
    constructor(e, t, n, r, s){
        this.from = e, this.length = t, this.top = n, this.height = r, this._content = s;
    }
    get type() {
        return typeof this._content == "number" ? Ke.Text : Array.isArray(this._content) ? this._content : this._content.type;
    }
    get to() {
        return this.from + this.length;
    }
    get bottom() {
        return this.top + this.height;
    }
    get widget() {
        return this._content instanceof Oi ? this._content.widget : null;
    }
    get widgetLineBreaks() {
        return typeof this._content == "number" ? this._content : 0;
    }
    join(e) {
        let t = (Array.isArray(this._content) ? this._content : [
            this
        ]).concat(Array.isArray(e._content) ? e._content : [
            e
        ]);
        return new It(this.from, this.length + e.length, this.top, this.height + e.height, t);
    }
}
var ue = function(i) {
    return i[i.ByPos = 0] = "ByPos", i[i.ByHeight = 1] = "ByHeight", i[i.ByPosNoHeight = 2] = "ByPosNoHeight", i;
}(ue || (ue = {}));
const Ms = .001;
class Ge {
    constructor(e, t, n = 2){
        this.length = e, this.height = t, this.flags = n;
    }
    get outdated() {
        return (this.flags & 2) > 0;
    }
    set outdated(e) {
        this.flags = (e ? 2 : 0) | this.flags & -3;
    }
    setHeight(e, t) {
        this.height != t && (Math.abs(this.height - t) > Ms && (e.heightChanged = !0), this.height = t);
    }
    replace(e, t, n) {
        return Ge.of(n);
    }
    decomposeLeft(e, t) {
        t.push(this);
    }
    decomposeRight(e, t) {
        t.push(this);
    }
    applyChanges(e, t, n, r) {
        let s = this, o = n.doc;
        for(let l = r.length - 1; l >= 0; l--){
            let { fromA: a, toA: c, fromB: h, toB: u } = r[l], f = s.lineAt(a, ue.ByPosNoHeight, n.setDoc(t), 0, 0), d = f.to >= c ? f : s.lineAt(c, ue.ByPosNoHeight, n, 0, 0);
            for(u += d.to - c, c = d.to; l > 0 && f.from <= r[l - 1].toA;)a = r[l - 1].fromA, h = r[l - 1].fromB, l--, a < f.from && (f = s.lineAt(a, ue.ByPosNoHeight, n, 0, 0));
            h += f.from - a, a = f.from;
            let p = yc.build(n.setDoc(o), e, h, u);
            s = s.replace(a, c, p);
        }
        return s.updateHeight(n, 0);
    }
    static empty() {
        return new nt(0, 0);
    }
    static of(e) {
        if (e.length == 1) return e[0];
        let t = 0, n = e.length, r = 0, s = 0;
        for(;;)if (t == n) {
            if (r > s * 2) {
                let l = e[t - 1];
                l.break ? e.splice(--t, 1, l.left, null, l.right) : e.splice(--t, 1, l.left, l.right), n += 1 + l.break, r -= l.size;
            } else if (s > r * 2) {
                let l = e[n];
                l.break ? e.splice(n, 1, l.left, null, l.right) : e.splice(n, 1, l.left, l.right), n += 2 + l.break, s -= l.size;
            } else break;
        } else if (r < s) {
            let l = e[t++];
            l && (r += l.size);
        } else {
            let l = e[--n];
            l && (s += l.size);
        }
        let o = 0;
        return e[t - 1] == null ? (o = 1, t--) : e[t] == null && (o = 1, n++), new V0(Ge.of(e.slice(0, t)), o, Ge.of(e.slice(n)));
    }
}
Ge.prototype.size = 1;
class Sp extends Ge {
    constructor(e, t, n){
        super(e, t), this.deco = n;
    }
    blockAt(e, t, n, r) {
        return new It(r, this.length, n, this.height, this.deco || 0);
    }
    lineAt(e, t, n, r, s) {
        return this.blockAt(0, n, r, s);
    }
    forEachLine(e, t, n, r, s, o) {
        e <= s + this.length && t >= s && o(this.blockAt(0, n, r, s));
    }
    updateHeight(e, t = 0, n = !1, r) {
        return r && r.from <= t && r.more && this.setHeight(e, r.heights[r.index++]), this.outdated = !1, this;
    }
    toString() {
        return `block(${this.length})`;
    }
}
class nt extends Sp {
    constructor(e, t){
        super(e, t, null), this.collapsed = 0, this.widgetHeight = 0, this.breaks = 0;
    }
    blockAt(e, t, n, r) {
        return new It(r, this.length, n, this.height, this.breaks);
    }
    replace(e, t, n) {
        let r = n[0];
        return n.length == 1 && (r instanceof nt || r instanceof Ee && r.flags & 4) && Math.abs(this.length - r.length) < 10 ? (r instanceof Ee ? r = new nt(r.length, this.height) : r.height = this.height, this.outdated || (r.outdated = !1), r) : Ge.of(n);
    }
    updateHeight(e, t = 0, n = !1, r) {
        return r && r.from <= t && r.more ? this.setHeight(e, r.heights[r.index++]) : (n || this.outdated) && this.setHeight(e, Math.max(this.widgetHeight, e.heightForLine(this.length - this.collapsed)) + this.breaks * e.lineHeight), this.outdated = !1, this;
    }
    toString() {
        return `line(${this.length}${this.collapsed ? -this.collapsed : ""}${this.widgetHeight ? ":" + this.widgetHeight : ""})`;
    }
}
class Ee extends Ge {
    constructor(e){
        super(e, 0);
    }
    heightMetrics(e, t) {
        let n = e.doc.lineAt(t).number, r = e.doc.lineAt(t + this.length).number, s = r - n + 1, o, l = 0;
        if (e.lineWrapping) {
            let a = Math.min(this.height, e.lineHeight * s);
            o = a / s, this.length > s + 1 && (l = (this.height - a) / (this.length - s - 1));
        } else o = this.height / s;
        return {
            firstLine: n,
            lastLine: r,
            perLine: o,
            perChar: l
        };
    }
    blockAt(e, t, n, r) {
        let { firstLine: s, lastLine: o, perLine: l, perChar: a } = this.heightMetrics(t, r);
        if (t.lineWrapping) {
            let c = r + Math.round(Math.max(0, Math.min(1, (e - n) / this.height)) * this.length), h = t.doc.lineAt(c), u = l + h.length * a, f = Math.max(n, e - u / 2);
            return new It(h.from, h.length, f, u, 0);
        } else {
            let c = Math.max(0, Math.min(o - s, Math.floor((e - n) / l))), { from: h, length: u } = t.doc.line(s + c);
            return new It(h, u, n + l * c, l, 0);
        }
    }
    lineAt(e, t, n, r, s) {
        if (t == ue.ByHeight) return this.blockAt(e, n, r, s);
        if (t == ue.ByPosNoHeight) {
            let { from: d, to: p } = n.doc.lineAt(e);
            return new It(d, p - d, 0, 0, 0);
        }
        let { firstLine: o, perLine: l, perChar: a } = this.heightMetrics(n, s), c = n.doc.lineAt(e), h = l + c.length * a, u = c.number - o, f = r + l * u + a * (c.from - s - u);
        return new It(c.from, c.length, Math.max(r, Math.min(f, r + this.height - h)), h, 0);
    }
    forEachLine(e, t, n, r, s, o) {
        e = Math.max(e, s), t = Math.min(t, s + this.length);
        let { firstLine: l, perLine: a, perChar: c } = this.heightMetrics(n, s);
        for(let h = e, u = r; h <= t;){
            let f = n.doc.lineAt(h);
            if (h == e) {
                let p = f.number - l;
                u += a * p + c * (e - s - p);
            }
            let d = a + c * f.length;
            o(new It(f.from, f.length, u, d, 0)), u += d, h = f.to + 1;
        }
    }
    replace(e, t, n) {
        let r = this.length - t;
        if (r > 0) {
            let s = n[n.length - 1];
            s instanceof Ee ? n[n.length - 1] = new Ee(s.length + r) : n.push(null, new Ee(r - 1));
        }
        if (e > 0) {
            let s = n[0];
            s instanceof Ee ? n[0] = new Ee(e + s.length) : n.unshift(new Ee(e - 1), null);
        }
        return Ge.of(n);
    }
    decomposeLeft(e, t) {
        t.push(new Ee(e - 1), null);
    }
    decomposeRight(e, t) {
        t.push(null, new Ee(this.length - e - 1));
    }
    updateHeight(e, t = 0, n = !1, r) {
        let s = t + this.length;
        if (r && r.from <= t + this.length && r.more) {
            let o = [], l = Math.max(t, r.from), a = -1;
            for(r.from > t && o.push(new Ee(r.from - t - 1).updateHeight(e, t)); l <= s && r.more;){
                let h = e.doc.lineAt(l).length;
                o.length && o.push(null);
                let u = r.heights[r.index++];
                a == -1 ? a = u : Math.abs(u - a) >= Ms && (a = -2);
                let f = new nt(h, u);
                f.outdated = !1, o.push(f), l += h + 1;
            }
            l <= s && o.push(null, new Ee(s - l).updateHeight(e, l));
            let c = Ge.of(o);
            return (a < 0 || Math.abs(c.height - this.height) >= Ms || Math.abs(a - this.heightMetrics(e, t).perLine) >= Ms) && (e.heightChanged = !0), c;
        } else (n || this.outdated) && (this.setHeight(e, e.heightForGap(t, t + this.length)), this.outdated = !1);
        return this;
    }
    toString() {
        return `gap(${this.length})`;
    }
}
class V0 extends Ge {
    constructor(e, t, n){
        super(e.length + t + n.length, e.height + n.height, t | (e.outdated || n.outdated ? 2 : 0)), this.left = e, this.right = n, this.size = e.size + n.size;
    }
    get break() {
        return this.flags & 1;
    }
    blockAt(e, t, n, r) {
        let s = n + this.left.height;
        return e < s ? this.left.blockAt(e, t, n, r) : this.right.blockAt(e, t, s, r + this.left.length + this.break);
    }
    lineAt(e, t, n, r, s) {
        let o = r + this.left.height, l = s + this.left.length + this.break, a = t == ue.ByHeight ? e < o : e < l, c = a ? this.left.lineAt(e, t, n, r, s) : this.right.lineAt(e, t, n, o, l);
        if (this.break || (a ? c.to < l : c.from > l)) return c;
        let h = t == ue.ByPosNoHeight ? ue.ByPosNoHeight : ue.ByPos;
        return a ? c.join(this.right.lineAt(l, h, n, o, l)) : this.left.lineAt(l, h, n, r, s).join(c);
    }
    forEachLine(e, t, n, r, s, o) {
        let l = r + this.left.height, a = s + this.left.length + this.break;
        if (this.break) e < a && this.left.forEachLine(e, t, n, r, s, o), t >= a && this.right.forEachLine(e, t, n, l, a, o);
        else {
            let c = this.lineAt(a, ue.ByPos, n, r, s);
            e < c.from && this.left.forEachLine(e, c.from - 1, n, r, s, o), c.to >= e && c.from <= t && o(c), t > c.to && this.right.forEachLine(c.to + 1, t, n, l, a, o);
        }
    }
    replace(e, t, n) {
        let r = this.left.length + this.break;
        if (t < r) return this.balanced(this.left.replace(e, t, n), this.right);
        if (e > this.left.length) return this.balanced(this.left, this.right.replace(e - r, t - r, n));
        let s = [];
        e > 0 && this.decomposeLeft(e, s);
        let o = s.length;
        for (let l of n)s.push(l);
        if (e > 0 && Mh(s, o - 1), t < this.length) {
            let l = s.length;
            this.decomposeRight(t, s), Mh(s, l);
        }
        return Ge.of(s);
    }
    decomposeLeft(e, t) {
        let n = this.left.length;
        if (e <= n) return this.left.decomposeLeft(e, t);
        t.push(this.left), this.break && (n++, e >= n && t.push(null)), e > n && this.right.decomposeLeft(e - n, t);
    }
    decomposeRight(e, t) {
        let n = this.left.length, r = n + this.break;
        if (e >= r) return this.right.decomposeRight(e - r, t);
        e < n && this.left.decomposeRight(e, t), this.break && e < r && t.push(null), t.push(this.right);
    }
    balanced(e, t) {
        return e.size > 2 * t.size || t.size > 2 * e.size ? Ge.of(this.break ? [
            e,
            null,
            t
        ] : [
            e,
            t
        ]) : (this.left = e, this.right = t, this.height = e.height + t.height, this.outdated = e.outdated || t.outdated, this.size = e.size + t.size, this.length = e.length + this.break + t.length, this);
    }
    updateHeight(e, t = 0, n = !1, r) {
        let { left: s, right: o } = this, l = t + s.length + this.break, a = null;
        return r && r.from <= t + s.length && r.more ? a = s = s.updateHeight(e, t, n, r) : s.updateHeight(e, t, n), r && r.from <= l + o.length && r.more ? a = o = o.updateHeight(e, l, n, r) : o.updateHeight(e, l, n), a ? this.balanced(s, o) : (this.height = this.left.height + this.right.height, this.outdated = !1, this);
    }
    toString() {
        return this.left + (this.break ? " " : "-") + this.right;
    }
}
function Mh(i, e) {
    let t, n;
    i[e] == null && (t = i[e - 1]) instanceof Ee && (n = i[e + 1]) instanceof Ee && i.splice(e - 1, 3, new Ee(t.length + 1 + n.length));
}
const $0 = 5;
class yc {
    constructor(e, t){
        this.pos = e, this.oracle = t, this.nodes = [], this.lineStart = -1, this.lineEnd = -1, this.covering = null, this.writtenTo = e;
    }
    get isCovered() {
        return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
    }
    span(e, t) {
        if (this.lineStart > -1) {
            let n = Math.min(t, this.lineEnd), r = this.nodes[this.nodes.length - 1];
            r instanceof nt ? r.length += n - this.pos : (n > this.pos || !this.isCovered) && this.nodes.push(new nt(n - this.pos, -1)), this.writtenTo = n, t > n && (this.nodes.push(null), this.writtenTo++, this.lineStart = -1);
        }
        this.pos = t;
    }
    point(e, t, n) {
        if (e < t || n.heightRelevant) {
            let r = n.widget ? n.widget.estimatedHeight : 0, s = n.widget ? n.widget.lineBreaks : 0;
            r < 0 && (r = this.oracle.lineHeight);
            let o = t - e;
            n.block ? this.addBlock(new Sp(o, r, n)) : (o || s || r >= $0) && this.addLineDeco(r, s, o);
        } else t > e && this.span(e, t);
        this.lineEnd > -1 && this.lineEnd < this.pos && (this.lineEnd = this.oracle.doc.lineAt(this.pos).to);
    }
    enterLine() {
        if (this.lineStart > -1) return;
        let { from: e, to: t } = this.oracle.doc.lineAt(this.pos);
        this.lineStart = e, this.lineEnd = t, this.writtenTo < e && ((this.writtenTo < e - 1 || this.nodes[this.nodes.length - 1] == null) && this.nodes.push(this.blankContent(this.writtenTo, e - 1)), this.nodes.push(null)), this.pos > e && this.nodes.push(new nt(this.pos - e, -1)), this.writtenTo = this.pos;
    }
    blankContent(e, t) {
        let n = new Ee(t - e);
        return this.oracle.doc.lineAt(e).to == t && (n.flags |= 4), n;
    }
    ensureLine() {
        this.enterLine();
        let e = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
        if (e instanceof nt) return e;
        let t = new nt(0, -1);
        return this.nodes.push(t), t;
    }
    addBlock(e) {
        this.enterLine();
        let t = e.deco;
        t && t.startSide > 0 && !this.isCovered && this.ensureLine(), this.nodes.push(e), this.writtenTo = this.pos = this.pos + e.length, t && t.endSide > 0 && (this.covering = e);
    }
    addLineDeco(e, t, n) {
        let r = this.ensureLine();
        r.length += n, r.collapsed += n, r.widgetHeight = Math.max(r.widgetHeight, e), r.breaks += t, this.writtenTo = this.pos = this.pos + n;
    }
    finish(e) {
        let t = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
        this.lineStart > -1 && !(t instanceof nt) && !this.isCovered ? this.nodes.push(new nt(0, -1)) : (this.writtenTo < this.pos || t == null) && this.nodes.push(this.blankContent(this.writtenTo, this.pos));
        let n = e;
        for (let r of this.nodes)r instanceof nt && r.updateHeight(this.oracle, n), n += r ? r.length : 1;
        return this.nodes;
    }
    static build(e, t, n, r) {
        let s = new yc(n, e);
        return le.spans(t, n, r, s, 0), s.finish(n);
    }
}
function z0(i, e, t) {
    let n = new U0;
    return le.compare(i, e, t, n, 0), n.changes;
}
class U0 {
    constructor(){
        this.changes = [];
    }
    compareRange() {}
    comparePoint(e, t, n, r) {
        (e < t || n && n.heightRelevant || r && r.heightRelevant) && El(e, t, this.changes, 5);
    }
}
function K0(i, e) {
    let t = i.getBoundingClientRect(), n = i.ownerDocument, r = n.defaultView || window, s = Math.max(0, t.left), o = Math.min(r.innerWidth, t.right), l = Math.max(0, t.top), a = Math.min(r.innerHeight, t.bottom);
    for(let c = i.parentNode; c && c != n.body;)if (c.nodeType == 1) {
        let h = c, u = window.getComputedStyle(h);
        if ((h.scrollHeight > h.clientHeight || h.scrollWidth > h.clientWidth) && u.overflow != "visible") {
            let f = h.getBoundingClientRect();
            s = Math.max(s, f.left), o = Math.min(o, f.right), l = Math.max(l, f.top), a = c == i.parentNode ? f.bottom : Math.min(a, f.bottom);
        }
        c = u.position == "absolute" || u.position == "fixed" ? h.offsetParent : h.parentNode;
    } else if (c.nodeType == 11) c = c.host;
    else break;
    return {
        left: s - t.left,
        right: Math.max(s, o) - t.left,
        top: l - (t.top + e),
        bottom: Math.max(l, a) - (t.top + e)
    };
}
function G0(i, e) {
    let t = i.getBoundingClientRect();
    return {
        left: 0,
        right: t.right - t.left,
        top: e,
        bottom: t.bottom - (t.top + e)
    };
}
class Go {
    constructor(e, t, n){
        this.from = e, this.to = t, this.size = n;
    }
    static same(e, t) {
        if (e.length != t.length) return !1;
        for(let n = 0; n < e.length; n++){
            let r = e[n], s = t[n];
            if (r.from != s.from || r.to != s.to || r.size != s.size) return !1;
        }
        return !0;
    }
    draw(e, t) {
        return ee.replace({
            widget: new J0(this.size * (t ? e.scaleY : e.scaleX), t)
        }).range(this.from, this.to);
    }
}
class J0 extends li {
    constructor(e, t){
        super(), this.size = e, this.vertical = t;
    }
    eq(e) {
        return e.size == this.size && e.vertical == this.vertical;
    }
    toDOM() {
        let e = document.createElement("div");
        return this.vertical ? e.style.height = this.size + "px" : (e.style.width = this.size + "px", e.style.height = "2px", e.style.display = "inline-block"), e;
    }
    get estimatedHeight() {
        return this.vertical ? this.size : -1;
    }
}
class Ah {
    constructor(e){
        this.state = e, this.pixelViewport = {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: 0
        }, this.inView = !0, this.paddingTop = 0, this.paddingBottom = 0, this.contentDOMWidth = 0, this.contentDOMHeight = 0, this.editorHeight = 0, this.editorWidth = 0, this.scrollTop = 0, this.scrolledToBottom = !0, this.scaleX = 1, this.scaleY = 1, this.scrollAnchorPos = 0, this.scrollAnchorHeight = -1, this.scaler = _h, this.scrollTarget = null, this.printing = !1, this.mustMeasureContent = !0, this.defaultTextDirection = ge.LTR, this.visibleRanges = [], this.mustEnforceCursorAssoc = !1;
        let t = e.facet(gc).some((n)=>typeof n != "function" && n.class == "cm-lineWrapping");
        this.heightOracle = new H0(t), this.stateDeco = e.facet(mr).filter((n)=>typeof n != "function"), this.heightMap = Ge.empty().applyChanges(this.stateDeco, X.empty, this.heightOracle.setDoc(e.doc), [
            new ut(0, 0, 0, e.doc.length)
        ]), this.viewport = this.getViewport(0, null), this.updateViewportLines(), this.updateForViewport(), this.lineGaps = this.ensureLineGaps([]), this.lineGapDeco = ee.set(this.lineGaps.map((n)=>n.draw(this, !1))), this.computeVisibleRanges();
    }
    updateForViewport() {
        let e = [
            this.viewport
        ], { main: t } = this.state.selection;
        for(let n = 0; n <= 1; n++){
            let r = n ? t.head : t.anchor;
            if (!e.some(({ from: s, to: o })=>r >= s && r <= o)) {
                let { from: s, to: o } = this.lineBlockAt(r);
                e.push(new hs(s, o));
            }
        }
        this.viewports = e.sort((n, r)=>n.from - r.from), this.scaler = this.heightMap.height <= 7e6 ? _h : new X0(this.heightOracle, this.heightMap, this.viewports);
    }
    updateViewportLines() {
        this.viewportLines = [], this.heightMap.forEachLine(this.viewport.from, this.viewport.to, this.heightOracle.setDoc(this.state.doc), 0, 0, (e)=>{
            this.viewportLines.push(this.scaler.scale == 1 ? e : lr(e, this.scaler));
        });
    }
    update(e, t = null) {
        this.state = e.state;
        let n = this.stateDeco;
        this.stateDeco = this.state.facet(mr).filter((h)=>typeof h != "function");
        let r = e.changedRanges, s = ut.extendWithRanges(r, z0(n, this.stateDeco, e ? e.changes : De.empty(this.state.doc.length))), o = this.heightMap.height, l = this.scrolledToBottom ? null : this.scrollAnchorAt(this.scrollTop);
        this.heightMap = this.heightMap.applyChanges(this.stateDeco, e.startState.doc, this.heightOracle.setDoc(this.state.doc), s), this.heightMap.height != o && (e.flags |= 2), l ? (this.scrollAnchorPos = e.changes.mapPos(l.from, -1), this.scrollAnchorHeight = l.top) : (this.scrollAnchorPos = -1, this.scrollAnchorHeight = this.heightMap.height);
        let a = s.length ? this.mapViewport(this.viewport, e.changes) : this.viewport;
        (t && (t.range.head < a.from || t.range.head > a.to) || !this.viewportIsAppropriate(a)) && (a = this.getViewport(0, t));
        let c = !e.changes.empty || e.flags & 2 || a.from != this.viewport.from || a.to != this.viewport.to;
        this.viewport = a, this.updateForViewport(), c && this.updateViewportLines(), (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) && this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps, e.changes))), e.flags |= this.computeVisibleRanges(), t && (this.scrollTarget = t), !this.mustEnforceCursorAssoc && e.selectionSet && e.view.lineWrapping && e.state.selection.main.empty && e.state.selection.main.assoc && !e.state.facet(ep) && (this.mustEnforceCursorAssoc = !0);
    }
    measure(e) {
        let t = e.contentDOM, n = window.getComputedStyle(t), r = this.heightOracle, s = n.whiteSpace;
        this.defaultTextDirection = n.direction == "rtl" ? ge.RTL : ge.LTR;
        let o = this.heightOracle.mustRefreshForWrapping(s), l = t.getBoundingClientRect(), a = o || this.mustMeasureContent || this.contentDOMHeight != l.height;
        this.contentDOMHeight = l.height, this.mustMeasureContent = !1;
        let c = 0, h = 0;
        if (l.width && l.height) {
            let S = l.width / t.offsetWidth, x = l.height / t.offsetHeight;
            (S > .995 && S < 1.005 || !isFinite(S) || Math.abs(l.width - t.offsetWidth) < 1) && (S = 1), (x > .995 && x < 1.005 || !isFinite(x) || Math.abs(l.height - t.offsetHeight) < 1) && (x = 1), (this.scaleX != S || this.scaleY != x) && (this.scaleX = S, this.scaleY = x, c |= 8, o = a = !0);
        }
        let u = (parseInt(n.paddingTop) || 0) * this.scaleY, f = (parseInt(n.paddingBottom) || 0) * this.scaleY;
        (this.paddingTop != u || this.paddingBottom != f) && (this.paddingTop = u, this.paddingBottom = f, c |= 10), this.editorWidth != e.scrollDOM.clientWidth && (r.lineWrapping && (a = !0), this.editorWidth = e.scrollDOM.clientWidth, c |= 8);
        let d = e.scrollDOM.scrollTop * this.scaleY;
        this.scrollTop != d && (this.scrollAnchorHeight = -1, this.scrollTop = d), this.scrolledToBottom = Id(e.scrollDOM);
        let p = (this.printing ? G0 : K0)(t, this.paddingTop), y = p.top - this.pixelViewport.top, b = p.bottom - this.pixelViewport.bottom;
        this.pixelViewport = p;
        let k = this.pixelViewport.bottom > this.pixelViewport.top && this.pixelViewport.right > this.pixelViewport.left;
        if (k != this.inView && (this.inView = k, k && (a = !0)), !this.inView && !this.scrollTarget) return 0;
        let T = l.width;
        if ((this.contentDOMWidth != T || this.editorHeight != e.scrollDOM.clientHeight) && (this.contentDOMWidth = l.width, this.editorHeight = e.scrollDOM.clientHeight, c |= 8), a) {
            let S = e.docView.measureVisibleLineHeights(this.viewport);
            if (r.mustRefreshForHeights(S) && (o = !0), o || r.lineWrapping && Math.abs(T - this.contentDOMWidth) > r.charWidth) {
                let { lineHeight: x, charWidth: R, textHeight: E } = e.docView.measureTextSize();
                o = x > 0 && r.refresh(s, x, R, E, T / R, S), o && (e.docView.minWidth = 0, c |= 8);
            }
            y > 0 && b > 0 ? h = Math.max(y, b) : y < 0 && b < 0 && (h = Math.min(y, b)), r.heightChanged = !1;
            for (let x of this.viewports){
                let R = x.from == this.viewport.from ? S : e.docView.measureVisibleLineHeights(x);
                this.heightMap = (o ? Ge.empty().applyChanges(this.stateDeco, X.empty, this.heightOracle, [
                    new ut(0, 0, 0, e.state.doc.length)
                ]) : this.heightMap).updateHeight(r, 0, o, new W0(x.from, R));
            }
            r.heightChanged && (c |= 2);
        }
        let D = !this.viewportIsAppropriate(this.viewport, h) || this.scrollTarget && (this.scrollTarget.range.head < this.viewport.from || this.scrollTarget.range.head > this.viewport.to);
        return D && (this.viewport = this.getViewport(h, this.scrollTarget)), this.updateForViewport(), (c & 2 || D) && this.updateViewportLines(), (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) && this.updateLineGaps(this.ensureLineGaps(o ? [] : this.lineGaps, e)), c |= this.computeVisibleRanges(), this.mustEnforceCursorAssoc && (this.mustEnforceCursorAssoc = !1, e.docView.enforceCursorAssoc()), c;
    }
    get visibleTop() {
        return this.scaler.fromDOM(this.pixelViewport.top);
    }
    get visibleBottom() {
        return this.scaler.fromDOM(this.pixelViewport.bottom);
    }
    getViewport(e, t) {
        let n = .5 - Math.max(-0.5, Math.min(.5, e / 1e3 / 2)), r = this.heightMap, s = this.heightOracle, { visibleTop: o, visibleBottom: l } = this, a = new hs(r.lineAt(o - n * 1e3, ue.ByHeight, s, 0, 0).from, r.lineAt(l + (1 - n) * 1e3, ue.ByHeight, s, 0, 0).to);
        if (t) {
            let { head: c } = t.range;
            if (c < a.from || c > a.to) {
                let h = Math.min(this.editorHeight, this.pixelViewport.bottom - this.pixelViewport.top), u = r.lineAt(c, ue.ByPos, s, 0, 0), f;
                t.y == "center" ? f = (u.top + u.bottom) / 2 - h / 2 : t.y == "start" || t.y == "nearest" && c < a.from ? f = u.top : f = u.bottom - h, a = new hs(r.lineAt(f - 500, ue.ByHeight, s, 0, 0).from, r.lineAt(f + h + 500, ue.ByHeight, s, 0, 0).to);
            }
        }
        return a;
    }
    mapViewport(e, t) {
        let n = t.mapPos(e.from, -1), r = t.mapPos(e.to, 1);
        return new hs(this.heightMap.lineAt(n, ue.ByPos, this.heightOracle, 0, 0).from, this.heightMap.lineAt(r, ue.ByPos, this.heightOracle, 0, 0).to);
    }
    viewportIsAppropriate({ from: e, to: t }, n = 0) {
        if (!this.inView) return !0;
        let { top: r } = this.heightMap.lineAt(e, ue.ByPos, this.heightOracle, 0, 0), { bottom: s } = this.heightMap.lineAt(t, ue.ByPos, this.heightOracle, 0, 0), { visibleTop: o, visibleBottom: l } = this;
        return (e == 0 || r <= o - Math.max(10, Math.min(-n, 250))) && (t == this.state.doc.length || s >= l + Math.max(10, Math.min(n, 250))) && r > o - 2000 && s < l + 2000;
    }
    mapLineGaps(e, t) {
        if (!e.length || t.empty) return e;
        let n = [];
        for (let r of e)t.touchesRange(r.from, r.to) || n.push(new Go(t.mapPos(r.from), t.mapPos(r.to), r.size));
        return n;
    }
    ensureLineGaps(e, t) {
        let n = this.heightOracle.lineWrapping, r = n ? 1e4 : 2e3, s = r >> 1, o = r << 1;
        if (this.defaultTextDirection != ge.LTR && !n) return [];
        let l = [], a = (c, h, u, f)=>{
            if (h - c < s) return;
            let d = this.state.selection.main, p = [
                d.from
            ];
            d.empty || p.push(d.to);
            for (let b of p)if (b > c && b < h) {
                a(c, b - 10, u, f), a(b + 10, h, u, f);
                return;
            }
            let y = Y0(e, (b)=>b.from >= u.from && b.to <= u.to && Math.abs(b.from - c) < s && Math.abs(b.to - h) < s && !p.some((k)=>b.from < k && b.to > k));
            if (!y) {
                if (h < u.to && t && n && t.visibleRanges.some((b)=>b.from <= h && b.to >= h)) {
                    let b = t.moveToLineBoundary(O.cursor(h), !1, !0).head;
                    b > c && (h = b);
                }
                y = new Go(c, h, this.gapSize(u, c, h, f));
            }
            l.push(y);
        };
        for (let c of this.viewportLines){
            if (c.length < o) continue;
            let h = Q0(c.from, c.to, this.stateDeco);
            if (h.total < o) continue;
            let u = this.scrollTarget ? this.scrollTarget.range.head : null, f, d;
            if (n) {
                let p = r / this.heightOracle.lineLength * this.heightOracle.lineHeight, y, b;
                if (u != null) {
                    let k = fs(h, u), T = ((this.visibleBottom - this.visibleTop) / 2 + p) / c.height;
                    y = k - T, b = k + T;
                } else y = (this.visibleTop - c.top - p) / c.height, b = (this.visibleBottom - c.top + p) / c.height;
                f = us(h, y), d = us(h, b);
            } else {
                let p = h.total * this.heightOracle.charWidth, y = r * this.heightOracle.charWidth, b, k;
                if (u != null) {
                    let T = fs(h, u), D = ((this.pixelViewport.right - this.pixelViewport.left) / 2 + y) / p;
                    b = T - D, k = T + D;
                } else b = (this.pixelViewport.left - y) / p, k = (this.pixelViewport.right + y) / p;
                f = us(h, b), d = us(h, k);
            }
            f > c.from && a(c.from, f, c, h), d < c.to && a(d, c.to, c, h);
        }
        return l;
    }
    gapSize(e, t, n, r) {
        let s = fs(r, n) - fs(r, t);
        return this.heightOracle.lineWrapping ? e.height * s : r.total * this.heightOracle.charWidth * s;
    }
    updateLineGaps(e) {
        Go.same(e, this.lineGaps) || (this.lineGaps = e, this.lineGapDeco = ee.set(e.map((t)=>t.draw(this, this.heightOracle.lineWrapping))));
    }
    computeVisibleRanges() {
        let e = this.stateDeco;
        this.lineGaps.length && (e = e.concat(this.lineGapDeco));
        let t = [];
        le.spans(e, this.viewport.from, this.viewport.to, {
            span (r, s) {
                t.push({
                    from: r,
                    to: s
                });
            },
            point () {}
        }, 20);
        let n = t.length != this.visibleRanges.length || this.visibleRanges.some((r, s)=>r.from != t[s].from || r.to != t[s].to);
        return this.visibleRanges = t, n ? 4 : 0;
    }
    lineBlockAt(e) {
        return e >= this.viewport.from && e <= this.viewport.to && this.viewportLines.find((t)=>t.from <= e && t.to >= e) || lr(this.heightMap.lineAt(e, ue.ByPos, this.heightOracle, 0, 0), this.scaler);
    }
    lineBlockAtHeight(e) {
        return lr(this.heightMap.lineAt(this.scaler.fromDOM(e), ue.ByHeight, this.heightOracle, 0, 0), this.scaler);
    }
    scrollAnchorAt(e) {
        let t = this.lineBlockAtHeight(e + 8);
        return t.from >= this.viewport.from || this.viewportLines[0].top - e > 200 ? t : this.viewportLines[0];
    }
    elementAtHeight(e) {
        return lr(this.heightMap.blockAt(this.scaler.fromDOM(e), this.heightOracle, 0, 0), this.scaler);
    }
    get docHeight() {
        return this.scaler.toDOM(this.heightMap.height);
    }
    get contentHeight() {
        return this.docHeight + this.paddingTop + this.paddingBottom;
    }
}
class hs {
    constructor(e, t){
        this.from = e, this.to = t;
    }
}
function Q0(i, e, t) {
    let n = [], r = i, s = 0;
    return le.spans(t, i, e, {
        span () {},
        point (o, l) {
            o > r && (n.push({
                from: r,
                to: o
            }), s += o - r), r = l;
        }
    }, 20), r < e && (n.push({
        from: r,
        to: e
    }), s += e - r), {
        total: s,
        ranges: n
    };
}
function us({ total: i, ranges: e }, t) {
    if (t <= 0) return e[0].from;
    if (t >= 1) return e[e.length - 1].to;
    let n = Math.floor(i * t);
    for(let r = 0;; r++){
        let { from: s, to: o } = e[r], l = o - s;
        if (n <= l) return s + n;
        n -= l;
    }
}
function fs(i, e) {
    let t = 0;
    for (let { from: n, to: r } of i.ranges){
        if (e <= r) {
            t += e - n;
            break;
        }
        t += r - n;
    }
    return t / i.total;
}
function Y0(i, e) {
    for (let t of i)if (e(t)) return t;
}
const _h = {
    toDOM (i) {
        return i;
    },
    fromDOM (i) {
        return i;
    },
    scale: 1
};
class X0 {
    constructor(e, t, n){
        let r = 0, s = 0, o = 0;
        this.viewports = n.map(({ from: l, to: a })=>{
            let c = t.lineAt(l, ue.ByPos, e, 0, 0).top, h = t.lineAt(a, ue.ByPos, e, 0, 0).bottom;
            return r += h - c, {
                from: l,
                to: a,
                top: c,
                bottom: h,
                domTop: 0,
                domBottom: 0
            };
        }), this.scale = (7e6 - r) / (t.height - r);
        for (let l of this.viewports)l.domTop = o + (l.top - s) * this.scale, o = l.domBottom = l.domTop + (l.bottom - l.top), s = l.bottom;
    }
    toDOM(e) {
        for(let t = 0, n = 0, r = 0;; t++){
            let s = t < this.viewports.length ? this.viewports[t] : null;
            if (!s || e < s.top) return r + (e - n) * this.scale;
            if (e <= s.bottom) return s.domTop + (e - s.top);
            n = s.bottom, r = s.domBottom;
        }
    }
    fromDOM(e) {
        for(let t = 0, n = 0, r = 0;; t++){
            let s = t < this.viewports.length ? this.viewports[t] : null;
            if (!s || e < s.domTop) return n + (e - r) / this.scale;
            if (e <= s.domBottom) return s.top + (e - s.domTop);
            n = s.bottom, r = s.domBottom;
        }
    }
}
function lr(i, e) {
    if (e.scale == 1) return i;
    let t = e.toDOM(i.top), n = e.toDOM(i.bottom);
    return new It(i.from, i.length, t, n - t, Array.isArray(i._content) ? i._content.map((r)=>lr(r, e)) : i._content);
}
const ds = q.define({
    combine: (i)=>i.join(" ")
}), Hl = q.define({
    combine: (i)=>i.indexOf(!0) > -1
}), Wl = xi.newName(), Cp = xi.newName(), Tp = xi.newName(), xp = {
    "&light": "." + Cp,
    "&dark": "." + Tp
};
function Vl(i, e, t) {
    return new xi(e, {
        finish (n) {
            return /&/.test(n) ? n.replace(/&\w*/, (r)=>{
                if (r == "&") return i;
                if (!t || !t[r]) throw new RangeError(`Unsupported selector: ${r}`);
                return t[r];
            }) : i + " " + n;
        }
    });
}
const Z0 = Vl("." + Wl, {
    "&": {
        position: "relative !important",
        boxSizing: "border-box",
        "&.cm-focused": {
            outline: "1px dotted #212121"
        },
        display: "flex !important",
        flexDirection: "column"
    },
    ".cm-scroller": {
        display: "flex !important",
        alignItems: "flex-start !important",
        fontFamily: "monospace",
        lineHeight: 1.4,
        height: "100%",
        overflowX: "auto",
        position: "relative",
        zIndex: 0
    },
    ".cm-content": {
        margin: 0,
        flexGrow: 2,
        flexShrink: 0,
        display: "block",
        whiteSpace: "pre",
        wordWrap: "normal",
        boxSizing: "border-box",
        minHeight: "100%",
        padding: "4px 0",
        outline: "none",
        "&[contenteditable=true]": {
            WebkitUserModify: "read-write-plaintext-only"
        }
    },
    ".cm-lineWrapping": {
        whiteSpace_fallback: "pre-wrap",
        whiteSpace: "break-spaces",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        flexShrink: 1
    },
    "&light .cm-content": {
        caretColor: "black"
    },
    "&dark .cm-content": {
        caretColor: "white"
    },
    ".cm-line": {
        display: "block",
        padding: "0 2px 0 6px"
    },
    ".cm-layer": {
        position: "absolute",
        left: 0,
        top: 0,
        contain: "size style",
        "& > *": {
            position: "absolute"
        }
    },
    "&light .cm-selectionBackground": {
        background: "#d9d9d9"
    },
    "&dark .cm-selectionBackground": {
        background: "#222"
    },
    "&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        background: "#d7d4f0"
    },
    "&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        background: "#233"
    },
    ".cm-cursorLayer": {
        pointerEvents: "none"
    },
    "&.cm-focused > .cm-scroller > .cm-cursorLayer": {
        animation: "steps(1) cm-blink 1.2s infinite"
    },
    "@keyframes cm-blink": {
        "0%": {},
        "50%": {
            opacity: 0
        },
        "100%": {}
    },
    "@keyframes cm-blink2": {
        "0%": {},
        "50%": {
            opacity: 0
        },
        "100%": {}
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeft: "1.2px solid black",
        marginLeft: "-0.6px",
        pointerEvents: "none"
    },
    ".cm-cursor": {
        display: "none"
    },
    "&dark .cm-cursor": {
        borderLeftColor: "#444"
    },
    ".cm-dropCursor": {
        position: "absolute"
    },
    "&.cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor": {
        display: "block"
    },
    "&light .cm-activeLine": {
        backgroundColor: "#cceeff44"
    },
    "&dark .cm-activeLine": {
        backgroundColor: "#99eeff33"
    },
    "&light .cm-specialChar": {
        color: "red"
    },
    "&dark .cm-specialChar": {
        color: "#f78"
    },
    ".cm-gutters": {
        flexShrink: 0,
        display: "flex",
        height: "100%",
        boxSizing: "border-box",
        insetInlineStart: 0,
        zIndex: 200
    },
    "&light .cm-gutters": {
        backgroundColor: "#f5f5f5",
        color: "#6c6c6c",
        borderRight: "1px solid #ddd"
    },
    "&dark .cm-gutters": {
        backgroundColor: "#333338",
        color: "#ccc"
    },
    ".cm-gutter": {
        display: "flex !important",
        flexDirection: "column",
        flexShrink: 0,
        boxSizing: "border-box",
        minHeight: "100%",
        overflow: "hidden"
    },
    ".cm-gutterElement": {
        boxSizing: "border-box"
    },
    ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 3px 0 5px",
        minWidth: "20px",
        textAlign: "right",
        whiteSpace: "nowrap"
    },
    "&light .cm-activeLineGutter": {
        backgroundColor: "#e2f2ff"
    },
    "&dark .cm-activeLineGutter": {
        backgroundColor: "#222227"
    },
    ".cm-panels": {
        boxSizing: "border-box",
        position: "sticky",
        left: 0,
        right: 0
    },
    "&light .cm-panels": {
        backgroundColor: "#f5f5f5",
        color: "black"
    },
    "&light .cm-panels-top": {
        borderBottom: "1px solid #ddd"
    },
    "&light .cm-panels-bottom": {
        borderTop: "1px solid #ddd"
    },
    "&dark .cm-panels": {
        backgroundColor: "#333338",
        color: "white"
    },
    ".cm-tab": {
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom"
    },
    ".cm-widgetBuffer": {
        verticalAlign: "text-top",
        height: "1em",
        width: 0,
        display: "inline"
    },
    ".cm-placeholder": {
        color: "#888",
        display: "inline-block",
        verticalAlign: "top"
    },
    ".cm-highlightSpace:before": {
        content: "attr(data-display)",
        position: "absolute",
        pointerEvents: "none",
        color: "#888"
    },
    ".cm-highlightTab": {
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>')`,
        backgroundSize: "auto 100%",
        backgroundPosition: "right 90%",
        backgroundRepeat: "no-repeat"
    },
    ".cm-trailingSpace": {
        backgroundColor: "#ff332255"
    },
    ".cm-button": {
        verticalAlign: "middle",
        color: "inherit",
        fontSize: "70%",
        padding: ".2em 1em",
        borderRadius: "1px"
    },
    "&light .cm-button": {
        backgroundImage: "linear-gradient(#eff1f5, #d9d9df)",
        border: "1px solid #888",
        "&:active": {
            backgroundImage: "linear-gradient(#b4b4b4, #d0d3d6)"
        }
    },
    "&dark .cm-button": {
        backgroundImage: "linear-gradient(#393939, #111)",
        border: "1px solid #888",
        "&:active": {
            backgroundImage: "linear-gradient(#111, #333)"
        }
    },
    ".cm-textfield": {
        verticalAlign: "middle",
        color: "inherit",
        fontSize: "70%",
        border: "1px solid silver",
        padding: ".2em .5em"
    },
    "&light .cm-textfield": {
        backgroundColor: "white"
    },
    "&dark .cm-textfield": {
        border: "1px solid #555",
        backgroundColor: "inherit"
    }
}, xp), ar = "\uFFFF";
class ey {
    constructor(e, t){
        this.points = e, this.text = "", this.lineSeparator = t.facet(ie.lineSeparator);
    }
    append(e) {
        this.text += e;
    }
    lineBreak() {
        this.text += ar;
    }
    readRange(e, t) {
        if (!e) return this;
        let n = e.parentNode;
        for(let r = e;;){
            this.findPointBefore(n, r);
            let s = this.text.length;
            this.readNode(r);
            let o = r.nextSibling;
            if (o == t) break;
            let l = fe.get(r), a = fe.get(o);
            (l && a ? l.breakAfter : (l ? l.breakAfter : Eh(r)) || Eh(o) && (r.nodeName != "BR" || r.cmIgnore) && this.text.length > s) && this.lineBreak(), r = o;
        }
        return this.findPointBefore(n, t), this;
    }
    readTextNode(e) {
        let t = e.nodeValue;
        for (let n of this.points)n.node == e && (n.pos = this.text.length + Math.min(n.offset, t.length));
        for(let n = 0, r = this.lineSeparator ? null : /\r\n?|\n/g;;){
            let s = -1, o = 1, l;
            if (this.lineSeparator ? (s = t.indexOf(this.lineSeparator, n), o = this.lineSeparator.length) : (l = r.exec(t)) && (s = l.index, o = l[0].length), this.append(t.slice(n, s < 0 ? t.length : s)), s < 0) break;
            if (this.lineBreak(), o > 1) for (let a of this.points)a.node == e && a.pos > this.text.length && (a.pos -= o - 1);
            n = s + o;
        }
    }
    readNode(e) {
        if (e.cmIgnore) return;
        let t = fe.get(e), n = t && t.overrideDOMText;
        if (n != null) {
            this.findPointInside(e, n.length);
            for(let r = n.iter(); !r.next().done;)r.lineBreak ? this.lineBreak() : this.append(r.value);
        } else e.nodeType == 3 ? this.readTextNode(e) : e.nodeName == "BR" ? e.nextSibling && this.lineBreak() : e.nodeType == 1 && this.readRange(e.firstChild, null);
    }
    findPointBefore(e, t) {
        for (let n of this.points)n.node == e && e.childNodes[n.offset] == t && (n.pos = this.text.length);
    }
    findPointInside(e, t) {
        for (let n of this.points)(e.nodeType == 3 ? n.node == e : e.contains(n.node)) && (n.pos = this.text.length + (ty(e, n.node, n.offset) ? t : 0));
    }
}
function ty(i, e, t) {
    for(;;){
        if (!e || t < ii(e)) return !1;
        if (e == i) return !0;
        t = gr(e) + 1, e = e.parentNode;
    }
}
function Eh(i) {
    return i.nodeType == 1 && /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(i.nodeName);
}
class Nh {
    constructor(e, t){
        this.node = e, this.offset = t, this.pos = -1;
    }
}
class iy {
    constructor(e, t, n, r){
        this.typeOver = r, this.bounds = null, this.text = "";
        let { impreciseHead: s, impreciseAnchor: o } = e.docView;
        if (e.state.readOnly && t > -1) this.newSel = null;
        else if (t > -1 && (this.bounds = e.docView.domBoundsAround(t, n, 0))) {
            let l = s || o ? [] : sy(e), a = new ey(l, e.state);
            a.readRange(this.bounds.startDOM, this.bounds.endDOM), this.text = a.text, this.newSel = oy(l, this.bounds.from);
        } else {
            let l = e.observer.selectionRange, a = s && s.node == l.focusNode && s.offset == l.focusOffset || !Ol(e.contentDOM, l.focusNode) ? e.state.selection.main.head : e.docView.posFromDOM(l.focusNode, l.focusOffset), c = o && o.node == l.anchorNode && o.offset == l.anchorOffset || !Ol(e.contentDOM, l.anchorNode) ? e.state.selection.main.anchor : e.docView.posFromDOM(l.anchorNode, l.anchorOffset);
            this.newSel = O.single(c, a);
        }
    }
}
function Rp(i, e) {
    let t, { newSel: n } = e, r = i.state.selection.main, s = i.inputState.lastKeyTime > Date.now() - 100 ? i.inputState.lastKeyCode : -1;
    if (e.bounds) {
        let { from: o, to: l } = e.bounds, a = r.from, c = null;
        (s === 8 || I.android && e.text.length < l - o) && (a = r.to, c = "end");
        let h = ry(i.state.doc.sliceString(o, l, ar), e.text, a - o, c);
        h && (I.chrome && s == 13 && h.toB == h.from + 2 && e.text.slice(h.from, h.toB) == ar + ar && h.toB--, t = {
            from: o + h.from,
            to: o + h.toA,
            insert: X.of(e.text.slice(h.from, h.toB).split(ar))
        });
    } else n && (!i.hasFocus && i.state.facet(Co) || n.main.eq(r)) && (n = null);
    if (!t && !n) return !1;
    if (!t && e.typeOver && !r.empty && n && n.main.empty ? t = {
        from: r.from,
        to: r.to,
        insert: i.state.doc.slice(r.from, r.to)
    } : t && t.from >= r.from && t.to <= r.to && (t.from != r.from || t.to != r.to) && r.to - r.from - (t.to - t.from) <= 4 ? t = {
        from: r.from,
        to: r.to,
        insert: i.state.doc.slice(r.from, t.from).append(t.insert).append(i.state.doc.slice(t.to, r.to))
    } : (I.mac || I.android) && t && t.from == t.to && t.from == r.head - 1 && /^\. ?$/.test(t.insert.toString()) && i.contentDOM.getAttribute("autocorrect") == "off" ? (n && t.insert.length == 2 && (n = O.single(n.main.anchor - 1, n.main.head - 1)), t = {
        from: r.from,
        to: r.to,
        insert: X.of([
            " "
        ])
    }) : I.chrome && t && t.from == t.to && t.from == r.head && t.insert.toString() == `
 ` && i.lineWrapping && (n && (n = O.single(n.main.anchor - 1, n.main.head - 1)), t = {
        from: r.from,
        to: r.to,
        insert: X.of([
            " "
        ])
    }), t) {
        if (I.ios && i.inputState.flushIOSKey() || I.android && (t.from == r.from && t.to == r.to && t.insert.length == 1 && t.insert.lines == 2 && un(i.contentDOM, "Enter", 13) || (t.from == r.from - 1 && t.to == r.to && t.insert.length == 0 || s == 8 && t.insert.length < t.to - t.from && t.to > r.head) && un(i.contentDOM, "Backspace", 8) || t.from == r.from && t.to == r.to + 1 && t.insert.length == 0 && un(i.contentDOM, "Delete", 46))) return !0;
        let o = t.insert.toString();
        i.inputState.composing >= 0 && i.inputState.composing++;
        let l, a = ()=>l || (l = ny(i, t, n));
        return i.state.facet(Yd).some((c)=>c(i, t.from, t.to, o, a)) || i.dispatch(a()), !0;
    } else if (n && !n.main.eq(r)) {
        let o = !1, l = "select";
        return i.inputState.lastSelectionTime > Date.now() - 50 && (i.inputState.lastSelectionOrigin == "select" && (o = !0), l = i.inputState.lastSelectionOrigin), i.dispatch({
            selection: n,
            scrollIntoView: o,
            userEvent: l
        }), !0;
    } else return !1;
}
function ny(i, e, t) {
    let n, r = i.state, s = r.selection.main;
    if (e.from >= s.from && e.to <= s.to && e.to - e.from >= (s.to - s.from) / 3 && (!t || t.main.empty && t.main.from == e.from + e.insert.length) && i.inputState.composing < 0) {
        let l = s.from < e.from ? r.sliceDoc(s.from, e.from) : "", a = s.to > e.to ? r.sliceDoc(e.to, s.to) : "";
        n = r.replaceSelection(i.state.toText(l + e.insert.sliceString(0, void 0, i.state.lineBreak) + a));
    } else {
        let l = r.changes(e), a = t && t.main.to <= l.newLength ? t.main : void 0;
        if (r.selection.ranges.length > 1 && i.inputState.composing >= 0 && e.to <= s.to && e.to >= s.to - 10) {
            let c = i.state.sliceDoc(e.from, e.to), h, u = t && hp(i, t.main.head);
            if (u) {
                let p = e.insert.length - (e.to - e.from);
                h = {
                    from: u.from,
                    to: u.to - p
                };
            } else h = i.state.doc.lineAt(s.head);
            let f = s.to - e.to, d = s.to - s.from;
            n = r.changeByRange((p)=>{
                if (p.from == s.from && p.to == s.to) return {
                    changes: l,
                    range: a || p.map(l)
                };
                let y = p.to - f, b = y - c.length;
                if (p.to - p.from != d || i.state.sliceDoc(b, y) != c || p.to >= h.from && p.from <= h.to) return {
                    range: p
                };
                let k = r.changes({
                    from: b,
                    to: y,
                    insert: e.insert
                }), T = p.to - s.to;
                return {
                    changes: k,
                    range: a ? O.range(Math.max(0, a.anchor + T), Math.max(0, a.head + T)) : p.map(k)
                };
            });
        } else n = {
            changes: l,
            selection: a && r.selection.replaceRange(a)
        };
    }
    let o = "input.type";
    return (i.composing || i.inputState.compositionPendingChange && i.inputState.compositionEndedAt > Date.now() - 50) && (i.inputState.compositionPendingChange = !1, o += ".compose", i.inputState.compositionFirstChange && (o += ".start", i.inputState.compositionFirstChange = !1)), r.update(n, {
        userEvent: o,
        scrollIntoView: !0
    });
}
function ry(i, e, t, n) {
    let r = Math.min(i.length, e.length), s = 0;
    for(; s < r && i.charCodeAt(s) == e.charCodeAt(s);)s++;
    if (s == r && i.length == e.length) return null;
    let o = i.length, l = e.length;
    for(; o > 0 && l > 0 && i.charCodeAt(o - 1) == e.charCodeAt(l - 1);)o--, l--;
    if (n == "end") {
        let a = Math.max(0, s - Math.min(o, l));
        t -= o + a - s;
    }
    if (o < s && i.length < e.length) {
        let a = t <= s && t >= o ? s - t : 0;
        s -= a, l = s + (l - o), o = s;
    } else if (l < s) {
        let a = t <= s && t >= l ? s - t : 0;
        s -= a, o = s + (o - l), l = s;
    }
    return {
        from: s,
        toA: o,
        toB: l
    };
}
function sy(i) {
    let e = [];
    if (i.root.activeElement != i.contentDOM) return e;
    let { anchorNode: t, anchorOffset: n, focusNode: r, focusOffset: s } = i.observer.selectionRange;
    return t && (e.push(new Nh(t, n)), (r != t || s != n) && e.push(new Nh(r, s))), e;
}
function oy(i, e) {
    if (i.length == 0) return null;
    let t = i[0].pos, n = i.length == 2 ? i[1].pos : t;
    return t > -1 && n > -1 ? O.single(t + e, n + e) : null;
}
const ly = {
    childList: !0,
    characterData: !0,
    subtree: !0,
    attributes: !0,
    characterDataOldValue: !0
}, Jo = I.ie && I.ie_version <= 11;
class ay {
    constructor(e){
        this.view = e, this.active = !1, this.selectionRange = new zm, this.selectionChanged = !1, this.delayedFlush = -1, this.resizeTimeout = -1, this.queue = [], this.delayedAndroidKey = null, this.flushingAndroidKey = -1, this.lastChange = 0, this.scrollTargets = [], this.intersection = null, this.resizeScroll = null, this.intersecting = !1, this.gapIntersection = null, this.gaps = [], this.parentCheck = -1, this.dom = e.contentDOM, this.observer = new MutationObserver((t)=>{
            for (let n of t)this.queue.push(n);
            (I.ie && I.ie_version <= 11 || I.ios && e.composing) && t.some((n)=>n.type == "childList" && n.removedNodes.length || n.type == "characterData" && n.oldValue.length > n.target.nodeValue.length) ? this.flushSoon() : this.flush();
        }), Jo && (this.onCharData = (t)=>{
            this.queue.push({
                target: t.target,
                type: "characterData",
                oldValue: t.prevValue
            }), this.flushSoon();
        }), this.onSelectionChange = this.onSelectionChange.bind(this), this.onResize = this.onResize.bind(this), this.onPrint = this.onPrint.bind(this), this.onScroll = this.onScroll.bind(this), typeof ResizeObserver == "function" && (this.resizeScroll = new ResizeObserver(()=>{
            var t;
            ((t = this.view.docView) === null || t === void 0 ? void 0 : t.lastUpdate) < Date.now() - 75 && this.onResize();
        }), this.resizeScroll.observe(e.scrollDOM)), this.addWindowListeners(this.win = e.win), this.start(), typeof IntersectionObserver == "function" && (this.intersection = new IntersectionObserver((t)=>{
            this.parentCheck < 0 && (this.parentCheck = setTimeout(this.listenForScroll.bind(this), 1e3)), t.length > 0 && t[t.length - 1].intersectionRatio > 0 != this.intersecting && (this.intersecting = !this.intersecting, this.intersecting != this.view.inView && this.onScrollChanged(document.createEvent("Event")));
        }, {
            threshold: [
                0,
                .001
            ]
        }), this.intersection.observe(this.dom), this.gapIntersection = new IntersectionObserver((t)=>{
            t.length > 0 && t[t.length - 1].intersectionRatio > 0 && this.onScrollChanged(document.createEvent("Event"));
        }, {})), this.listenForScroll(), this.readSelectionRange();
    }
    onScrollChanged(e) {
        this.view.inputState.runHandlers("scroll", e), this.intersecting && this.view.measure();
    }
    onScroll(e) {
        this.intersecting && this.flush(!1), this.onScrollChanged(e);
    }
    onResize() {
        this.resizeTimeout < 0 && (this.resizeTimeout = setTimeout(()=>{
            this.resizeTimeout = -1, this.view.requestMeasure();
        }, 50));
    }
    onPrint() {
        this.view.viewState.printing = !0, this.view.measure(), setTimeout(()=>{
            this.view.viewState.printing = !1, this.view.requestMeasure();
        }, 500);
    }
    updateGaps(e) {
        if (this.gapIntersection && (e.length != this.gaps.length || this.gaps.some((t, n)=>t != e[n]))) {
            this.gapIntersection.disconnect();
            for (let t of e)this.gapIntersection.observe(t);
            this.gaps = e;
        }
    }
    onSelectionChange(e) {
        let t = this.selectionChanged;
        if (!this.readSelectionRange() || this.delayedAndroidKey) return;
        let { view: n } = this, r = this.selectionRange;
        if (n.state.facet(Co) ? n.root.activeElement != this.dom : !Ds(n.dom, r)) return;
        let s = r.anchorNode && n.docView.nearest(r.anchorNode);
        if (s && s.ignoreEvent(e)) {
            t || (this.selectionChanged = !1);
            return;
        }
        (I.ie && I.ie_version <= 11 || I.android && I.chrome) && !n.state.selection.main.empty && r.focusNode && Hs(r.focusNode, r.focusOffset, r.anchorNode, r.anchorOffset) ? this.flushSoon() : this.flush(!1);
    }
    readSelectionRange() {
        let { view: e } = this, t = I.safari && e.root.nodeType == 11 && Hm(this.dom.ownerDocument) == this.dom && cy(this.view) || Fs(e.root);
        if (!t || this.selectionRange.eq(t)) return !1;
        let n = Ds(this.dom, t);
        return n && !this.selectionChanged && e.inputState.lastFocusTime > Date.now() - 200 && e.inputState.lastTouchTime < Date.now() - 300 && Km(this.dom, t) ? (this.view.inputState.lastFocusTime = 0, e.docView.updateSelection(), !1) : (this.selectionRange.setRange(t), n && (this.selectionChanged = !0), !0);
    }
    setSelectionRange(e, t) {
        this.selectionRange.set(e.node, e.offset, t.node, t.offset), this.selectionChanged = !1;
    }
    clearSelectionRange() {
        this.selectionRange.set(null, 0, null, 0);
    }
    listenForScroll() {
        this.parentCheck = -1;
        let e = 0, t = null;
        for(let n = this.dom; n;)if (n.nodeType == 1) !t && e < this.scrollTargets.length && this.scrollTargets[e] == n ? e++ : t || (t = this.scrollTargets.slice(0, e)), t && t.push(n), n = n.assignedSlot || n.parentNode;
        else if (n.nodeType == 11) n = n.host;
        else break;
        if (e < this.scrollTargets.length && !t && (t = this.scrollTargets.slice(0, e)), t) {
            for (let n of this.scrollTargets)n.removeEventListener("scroll", this.onScroll);
            for (let n of this.scrollTargets = t)n.addEventListener("scroll", this.onScroll);
        }
    }
    ignore(e) {
        if (!this.active) return e();
        try {
            return this.stop(), e();
        } finally{
            this.start(), this.clear();
        }
    }
    start() {
        this.active || (this.observer.observe(this.dom, ly), Jo && this.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.active = !0);
    }
    stop() {
        this.active && (this.active = !1, this.observer.disconnect(), Jo && this.dom.removeEventListener("DOMCharacterDataModified", this.onCharData));
    }
    clear() {
        this.processRecords(), this.queue.length = 0, this.selectionChanged = !1;
    }
    delayAndroidKey(e, t) {
        var n;
        if (!this.delayedAndroidKey) {
            let r = ()=>{
                let s = this.delayedAndroidKey;
                s && (this.clearDelayedAndroidKey(), this.view.inputState.lastKeyCode = s.keyCode, this.view.inputState.lastKeyTime = Date.now(), !this.flush() && s.force && un(this.dom, s.key, s.keyCode));
            };
            this.flushingAndroidKey = this.view.win.requestAnimationFrame(r);
        }
        (!this.delayedAndroidKey || e == "Enter") && (this.delayedAndroidKey = {
            key: e,
            keyCode: t,
            force: this.lastChange < Date.now() - 50 || !!(!((n = this.delayedAndroidKey) === null || n === void 0) && n.force)
        });
    }
    clearDelayedAndroidKey() {
        this.win.cancelAnimationFrame(this.flushingAndroidKey), this.delayedAndroidKey = null, this.flushingAndroidKey = -1;
    }
    flushSoon() {
        this.delayedFlush < 0 && (this.delayedFlush = this.view.win.requestAnimationFrame(()=>{
            this.delayedFlush = -1, this.flush();
        }));
    }
    forceFlush() {
        this.delayedFlush >= 0 && (this.view.win.cancelAnimationFrame(this.delayedFlush), this.delayedFlush = -1), this.flush();
    }
    pendingRecords() {
        for (let e of this.observer.takeRecords())this.queue.push(e);
        return this.queue;
    }
    processRecords() {
        let e = this.pendingRecords();
        e.length && (this.queue = []);
        let t = -1, n = -1, r = !1;
        for (let s of e){
            let o = this.readMutation(s);
            o && (o.typeOver && (r = !0), t == -1 ? { from: t, to: n } = o : (t = Math.min(o.from, t), n = Math.max(o.to, n)));
        }
        return {
            from: t,
            to: n,
            typeOver: r
        };
    }
    readChange() {
        let { from: e, to: t, typeOver: n } = this.processRecords(), r = this.selectionChanged && Ds(this.dom, this.selectionRange);
        if (e < 0 && !r) return null;
        e > -1 && (this.lastChange = Date.now()), this.view.inputState.lastFocusTime = 0, this.selectionChanged = !1;
        let s = new iy(this.view, e, t, n);
        return this.view.docView.domChanged = {
            newSel: s.newSel ? s.newSel.main : null
        }, s;
    }
    flush(e = !0) {
        if (this.delayedFlush >= 0 || this.delayedAndroidKey) return !1;
        e && this.readSelectionRange();
        let t = this.readChange();
        if (!t) return this.view.requestMeasure(), !1;
        let n = this.view.state, r = Rp(this.view, t);
        return this.view.state == n && this.view.update([]), r;
    }
    readMutation(e) {
        let t = this.view.docView.nearest(e.target);
        if (!t || t.ignoreMutation(e)) return null;
        if (t.markDirty(e.type == "attributes"), e.type == "attributes" && (t.flags |= 4), e.type == "childList") {
            let n = Lh(t, e.previousSibling || e.target.previousSibling, -1), r = Lh(t, e.nextSibling || e.target.nextSibling, 1);
            return {
                from: n ? t.posAfter(n) : t.posAtStart,
                to: r ? t.posBefore(r) : t.posAtEnd,
                typeOver: !1
            };
        } else return e.type == "characterData" ? {
            from: t.posAtStart,
            to: t.posAtEnd,
            typeOver: e.target.nodeValue == e.oldValue
        } : null;
    }
    setWindow(e) {
        e != this.win && (this.removeWindowListeners(this.win), this.win = e, this.addWindowListeners(this.win));
    }
    addWindowListeners(e) {
        e.addEventListener("resize", this.onResize), e.addEventListener("beforeprint", this.onPrint), e.addEventListener("scroll", this.onScroll), e.document.addEventListener("selectionchange", this.onSelectionChange);
    }
    removeWindowListeners(e) {
        e.removeEventListener("scroll", this.onScroll), e.removeEventListener("resize", this.onResize), e.removeEventListener("beforeprint", this.onPrint), e.document.removeEventListener("selectionchange", this.onSelectionChange);
    }
    destroy() {
        var e, t, n;
        this.stop(), (e = this.intersection) === null || e === void 0 || e.disconnect(), (t = this.gapIntersection) === null || t === void 0 || t.disconnect(), (n = this.resizeScroll) === null || n === void 0 || n.disconnect();
        for (let r of this.scrollTargets)r.removeEventListener("scroll", this.onScroll);
        this.removeWindowListeners(this.win), clearTimeout(this.parentCheck), clearTimeout(this.resizeTimeout), this.win.cancelAnimationFrame(this.delayedFlush), this.win.cancelAnimationFrame(this.flushingAndroidKey);
    }
}
function Lh(i, e, t) {
    for(; e;){
        let n = fe.get(e);
        if (n && n.parent == i) return n;
        let r = e.parentNode;
        e = r != i.dom ? r : t > 0 ? e.nextSibling : e.previousSibling;
    }
    return null;
}
function cy(i) {
    let e = null;
    function t(a) {
        a.preventDefault(), a.stopImmediatePropagation(), e = a.getTargetRanges()[0];
    }
    if (i.contentDOM.addEventListener("beforeinput", t, !0), i.dom.ownerDocument.execCommand("indent"), i.contentDOM.removeEventListener("beforeinput", t, !0), !e) return null;
    let n = e.startContainer, r = e.startOffset, s = e.endContainer, o = e.endOffset, l = i.docView.domAtPos(i.state.selection.main.anchor);
    return Hs(l.node, l.offset, s, o) && ([n, r, s, o] = [
        s,
        o,
        n,
        r
    ]), {
        anchorNode: n,
        anchorOffset: r,
        focusNode: s,
        focusOffset: o
    };
}
class $ {
    get state() {
        return this.viewState.state;
    }
    get viewport() {
        return this.viewState.viewport;
    }
    get visibleRanges() {
        return this.viewState.visibleRanges;
    }
    get inView() {
        return this.viewState.inView;
    }
    get composing() {
        return this.inputState.composing > 0;
    }
    get compositionStarted() {
        return this.inputState.composing >= 0;
    }
    get root() {
        return this._root;
    }
    get win() {
        return this.dom.ownerDocument.defaultView || window;
    }
    constructor(e = {}){
        this.plugins = [], this.pluginMap = new Map, this.editorAttrs = {}, this.contentAttrs = {}, this.bidiCache = [], this.destroyed = !1, this.updateState = 2, this.measureScheduled = -1, this.measureRequests = [], this.contentDOM = document.createElement("div"), this.scrollDOM = document.createElement("div"), this.scrollDOM.tabIndex = -1, this.scrollDOM.className = "cm-scroller", this.scrollDOM.appendChild(this.contentDOM), this.announceDOM = document.createElement("div"), this.announceDOM.style.cssText = "position: fixed; top: -10000px", this.announceDOM.setAttribute("aria-live", "polite"), this.dom = document.createElement("div"), this.dom.appendChild(this.announceDOM), this.dom.appendChild(this.scrollDOM);
        let { dispatch: t } = e;
        this.dispatchTransactions = e.dispatchTransactions || t && ((n)=>n.forEach((r)=>t(r, this))) || ((n)=>this.update(n)), this.dispatch = this.dispatch.bind(this), this._root = e.root || Um(e.parent) || document, this.viewState = new Ah(e.state || ie.create(e)), this.plugins = this.state.facet(sr).map((n)=>new zo(n));
        for (let n of this.plugins)n.update(this);
        this.observer = new ay(this), this.inputState = new T0(this), this.inputState.ensureHandlers(this.plugins), this.docView = new dh(this), this.mountStyles(), this.updateAttrs(), this.updateState = 0, this.requestMeasure(), e.parent && e.parent.appendChild(this.dom);
    }
    dispatch(...e) {
        let t = e.length == 1 && e[0] instanceof Pe ? e : e.length == 1 && Array.isArray(e[0]) ? e[0] : [
            this.state.update(...e)
        ];
        this.dispatchTransactions(t, this);
    }
    update(e) {
        if (this.updateState != 0) throw new Error("Calls to EditorView.update are not allowed while an update is in progress");
        let t = !1, n = !1, r, s = this.state;
        for (let f of e){
            if (f.startState != s) throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.");
            s = f.state;
        }
        if (this.destroyed) {
            this.viewState.state = s;
            return;
        }
        let o = this.hasFocus, l = 0, a = null;
        e.some((f)=>f.annotation(vp)) ? (this.inputState.notifiedFocused = o, l = 1) : o != this.inputState.notifiedFocused && (this.inputState.notifiedFocused = o, a = wp(s, o), a || (l = 1));
        let c = this.observer.delayedAndroidKey, h = null;
        if (c ? (this.observer.clearDelayedAndroidKey(), h = this.observer.readChange(), (h && !this.state.doc.eq(s.doc) || !this.state.selection.eq(s.selection)) && (h = null)) : this.observer.clear(), s.facet(ie.phrases) != this.state.facet(ie.phrases)) return this.setState(s);
        r = Vs.create(this, s, e), r.flags |= l;
        let u = this.viewState.scrollTarget;
        try {
            this.updateState = 2;
            for (let f of e){
                if (u && (u = u.map(f.changes)), f.scrollIntoView) {
                    let { main: d } = f.state.selection;
                    u = new Ws(d.empty ? d : O.cursor(d.head, d.head > d.anchor ? -1 : 1));
                }
                for (let d of f.effects)d.is(uh) && (u = d.value);
            }
            this.viewState.update(r, u), this.bidiCache = $s.update(this.bidiCache, r.changes), r.empty || (this.updatePlugins(r), this.inputState.update(r)), t = this.docView.update(r), this.state.facet(or) != this.styleModules && this.mountStyles(), n = this.updateAttrs(), this.showAnnouncements(e), this.docView.updateSelection(t, e.some((f)=>f.isUserEvent("select.pointer")));
        } finally{
            this.updateState = 0;
        }
        if (r.startState.facet(ds) != r.state.facet(ds) && (this.viewState.mustMeasureContent = !0), (t || n || u || this.viewState.mustEnforceCursorAssoc || this.viewState.mustMeasureContent) && this.requestMeasure(), !r.empty) for (let f of this.state.facet(Nl))f(r);
        (a || h) && Promise.resolve().then(()=>{
            a && this.state == a.startState && this.dispatch(a), h && !Rp(this, h) && c.force && un(this.contentDOM, c.key, c.keyCode);
        });
    }
    setState(e) {
        if (this.updateState != 0) throw new Error("Calls to EditorView.setState are not allowed while an update is in progress");
        if (this.destroyed) {
            this.viewState.state = e;
            return;
        }
        this.updateState = 2;
        let t = this.hasFocus;
        try {
            for (let n of this.plugins)n.destroy(this);
            this.viewState = new Ah(e), this.plugins = e.facet(sr).map((n)=>new zo(n)), this.pluginMap.clear();
            for (let n of this.plugins)n.update(this);
            this.docView = new dh(this), this.inputState.ensureHandlers(this.plugins), this.mountStyles(), this.updateAttrs(), this.bidiCache = [];
        } finally{
            this.updateState = 0;
        }
        t && this.focus(), this.requestMeasure();
    }
    updatePlugins(e) {
        let t = e.startState.facet(sr), n = e.state.facet(sr);
        if (t != n) {
            let r = [];
            for (let s of n){
                let o = t.indexOf(s);
                if (o < 0) r.push(new zo(s));
                else {
                    let l = this.plugins[o];
                    l.mustUpdate = e, r.push(l);
                }
            }
            for (let s of this.plugins)s.mustUpdate != e && s.destroy(this);
            this.plugins = r, this.pluginMap.clear();
        } else for (let r of this.plugins)r.mustUpdate = e;
        for(let r = 0; r < this.plugins.length; r++)this.plugins[r].update(this);
        t != n && this.inputState.ensureHandlers(this.plugins);
    }
    measure(e = !0) {
        if (this.destroyed) return;
        if (this.measureScheduled > -1 && this.win.cancelAnimationFrame(this.measureScheduled), this.observer.delayedAndroidKey) {
            this.measureScheduled = -1, this.requestMeasure();
            return;
        }
        this.measureScheduled = 0, e && this.observer.forceFlush();
        let t = null, n = this.scrollDOM, r = n.scrollTop * this.scaleY, { scrollAnchorPos: s, scrollAnchorHeight: o } = this.viewState;
        Math.abs(r - this.viewState.scrollTop) > 1 && (o = -1), this.viewState.scrollAnchorHeight = -1;
        try {
            for(let l = 0;; l++){
                if (o < 0) {
                    if (Id(n)) s = -1, o = this.viewState.heightMap.height;
                    else {
                        let d = this.viewState.scrollAnchorAt(r);
                        s = d.from, o = d.top;
                    }
                }
                this.updateState = 1;
                let a = this.viewState.measure(this);
                if (!a && !this.measureRequests.length && this.viewState.scrollTarget == null) break;
                if (l > 5) {
                    console.warn(this.measureRequests.length ? "Measure loop restarted more than 5 times" : "Viewport failed to stabilize");
                    break;
                }
                let c = [];
                a & 4 || ([this.measureRequests, c] = [
                    c,
                    this.measureRequests
                ]);
                let h = c.map((d)=>{
                    try {
                        return d.read(this);
                    } catch (p) {
                        return Tt(this.state, p), Bh;
                    }
                }), u = Vs.create(this, this.state, []), f = !1;
                u.flags |= a, t ? t.flags |= a : t = u, this.updateState = 2, u.empty || (this.updatePlugins(u), this.inputState.update(u), this.updateAttrs(), f = this.docView.update(u));
                for(let d = 0; d < c.length; d++)if (h[d] != Bh) try {
                    let p = c[d];
                    p.write && p.write(h[d], this);
                } catch (p) {
                    Tt(this.state, p);
                }
                if (f && this.docView.updateSelection(!0), !u.viewportChanged && this.measureRequests.length == 0) {
                    if (this.viewState.editorHeight) {
                        if (this.viewState.scrollTarget) {
                            this.docView.scrollIntoView(this.viewState.scrollTarget), this.viewState.scrollTarget = null;
                            continue;
                        } else {
                            let p = (s < 0 ? this.viewState.heightMap.height : this.viewState.lineBlockAt(s).top) - o;
                            if (p > 1 || p < -1) {
                                r = r + p, n.scrollTop = r / this.scaleY, o = -1;
                                continue;
                            }
                        }
                    }
                    break;
                }
            }
        } finally{
            this.updateState = 0, this.measureScheduled = -1;
        }
        if (t && !t.empty) for (let l of this.state.facet(Nl))l(t);
    }
    get themeClasses() {
        return Wl + " " + (this.state.facet(Hl) ? Tp : Cp) + " " + this.state.facet(ds);
    }
    updateAttrs() {
        let e = Ih(this, tp, {
            class: "cm-editor" + (this.hasFocus ? " cm-focused " : " ") + this.themeClasses
        }), t = {
            spellcheck: "false",
            autocorrect: "off",
            autocapitalize: "off",
            translate: "no",
            contenteditable: this.state.facet(Co) ? "true" : "false",
            class: "cm-content",
            style: `${I.tabSize}: ${this.state.tabSize}`,
            role: "textbox",
            "aria-multiline": "true"
        };
        this.state.readOnly && (t["aria-readonly"] = "true"), Ih(this, gc, t);
        let n = this.observer.ignore(()=>{
            let r = _l(this.contentDOM, this.contentAttrs, t), s = _l(this.dom, this.editorAttrs, e);
            return r || s;
        });
        return this.editorAttrs = e, this.contentAttrs = t, n;
    }
    showAnnouncements(e) {
        let t = !0;
        for (let n of e)for (let r of n.effects)if (r.is($.announce)) {
            t && (this.announceDOM.textContent = ""), t = !1;
            let s = this.announceDOM.appendChild(document.createElement("div"));
            s.textContent = r.value;
        }
    }
    mountStyles() {
        this.styleModules = this.state.facet(or);
        let e = this.state.facet($.cspNonce);
        xi.mount(this.root, this.styleModules.concat(Z0).reverse(), e ? {
            nonce: e
        } : void 0);
    }
    readMeasured() {
        if (this.updateState == 2) throw new Error("Reading the editor layout isn't allowed during an update");
        this.updateState == 0 && this.measureScheduled > -1 && this.measure(!1);
    }
    requestMeasure(e) {
        if (this.measureScheduled < 0 && (this.measureScheduled = this.win.requestAnimationFrame(()=>this.measure())), e) {
            if (this.measureRequests.indexOf(e) > -1) return;
            if (e.key != null) {
                for(let t = 0; t < this.measureRequests.length; t++)if (this.measureRequests[t].key === e.key) {
                    this.measureRequests[t] = e;
                    return;
                }
            }
            this.measureRequests.push(e);
        }
    }
    plugin(e) {
        let t = this.pluginMap.get(e);
        return (t === void 0 || t && t.spec != e) && this.pluginMap.set(e, t = this.plugins.find((n)=>n.spec == e) || null), t && t.update(this).value;
    }
    get documentTop() {
        return this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop;
    }
    get documentPadding() {
        return {
            top: this.viewState.paddingTop,
            bottom: this.viewState.paddingBottom
        };
    }
    get scaleX() {
        return this.viewState.scaleX;
    }
    get scaleY() {
        return this.viewState.scaleY;
    }
    elementAtHeight(e) {
        return this.readMeasured(), this.viewState.elementAtHeight(e);
    }
    lineBlockAtHeight(e) {
        return this.readMeasured(), this.viewState.lineBlockAtHeight(e);
    }
    get viewportLineBlocks() {
        return this.viewState.viewportLines;
    }
    lineBlockAt(e) {
        return this.viewState.lineBlockAt(e);
    }
    get contentHeight() {
        return this.viewState.contentHeight;
    }
    moveByChar(e, t, n) {
        return Ko(this, e, vh(this, e, t, n));
    }
    moveByGroup(e, t) {
        return Ko(this, e, vh(this, e, t, (n)=>S0(this, e.head, n)));
    }
    moveToLineBoundary(e, t, n = !0) {
        return k0(this, e, t, n);
    }
    moveVertically(e, t, n) {
        return Ko(this, e, C0(this, e, t, n));
    }
    domAtPos(e) {
        return this.docView.domAtPos(e);
    }
    posAtDOM(e, t = 0) {
        return this.docView.posFromDOM(e, t);
    }
    posAtCoords(e, t = !0) {
        return this.readMeasured(), fp(this, e, t);
    }
    coordsAtPos(e, t = 1) {
        this.readMeasured();
        let n = this.docView.coordsAt(e, t);
        if (!n || n.left == n.right) return n;
        let r = this.state.doc.lineAt(e), s = this.bidiSpans(r), o = s[mi.find(s, e - r.from, -1, t)];
        return ko(n, o.dir == ge.LTR == t > 0);
    }
    coordsForChar(e) {
        return this.readMeasured(), this.docView.coordsForChar(e);
    }
    get defaultCharacterWidth() {
        return this.viewState.heightOracle.charWidth;
    }
    get defaultLineHeight() {
        return this.viewState.heightOracle.lineHeight;
    }
    get textDirection() {
        return this.viewState.defaultTextDirection;
    }
    textDirectionAt(e) {
        return !this.state.facet(Zd) || e < this.viewport.from || e > this.viewport.to ? this.textDirection : (this.readMeasured(), this.docView.textDirectionAt(e));
    }
    get lineWrapping() {
        return this.viewState.heightOracle.lineWrapping;
    }
    bidiSpans(e) {
        if (e.length > hy) return ap(e.length);
        let t = this.textDirectionAt(e.from), n;
        for (let s of this.bidiCache)if (s.from == e.from && s.dir == t && (s.fresh || lp(s.isolates, n = fh(this, e.from, e.to)))) return s.order;
        n || (n = fh(this, e.from, e.to));
        let r = l0(e.text, t, n);
        return this.bidiCache.push(new $s(e.from, e.to, t, n, !0, r)), r;
    }
    get hasFocus() {
        var e;
        return (this.dom.ownerDocument.hasFocus() || I.safari && ((e = this.inputState) === null || e === void 0 ? void 0 : e.lastContextMenu) > Date.now() - 3e4) && this.root.activeElement == this.contentDOM;
    }
    focus() {
        this.observer.ignore(()=>{
            Ld(this.contentDOM), this.docView.updateSelection();
        });
    }
    setRoot(e) {
        this._root != e && (this._root = e, this.observer.setWindow((e.nodeType == 9 ? e : e.ownerDocument).defaultView || window), this.mountStyles());
    }
    destroy() {
        for (let e of this.plugins)e.destroy(this);
        this.plugins = [], this.inputState.destroy(), this.dom.remove(), this.observer.destroy(), this.measureScheduled > -1 && this.win.cancelAnimationFrame(this.measureScheduled), this.destroyed = !0;
    }
    static scrollIntoView(e, t = {}) {
        return uh.of(new Ws(typeof e == "number" ? O.cursor(e) : e, t.y, t.x, t.yMargin, t.xMargin));
    }
    static domEventHandlers(e) {
        return Ie.define(()=>({}), {
            eventHandlers: e
        });
    }
    static domEventObservers(e) {
        return Ie.define(()=>({}), {
            eventObservers: e
        });
    }
    static theme(e, t) {
        let n = xi.newName(), r = [
            ds.of(n),
            or.of(Vl(`.${n}`, e))
        ];
        return t && t.dark && r.push(Hl.of(!0)), r;
    }
    static baseTheme(e) {
        return Mr.lowest(or.of(Vl("." + Wl, e, xp)));
    }
    static findFromDOM(e) {
        var t;
        let n = e.querySelector(".cm-content"), r = n && fe.get(n) || fe.get(e);
        return ((t = r == null ? void 0 : r.rootView) === null || t === void 0 ? void 0 : t.view) || null;
    }
}
$.styleModule = or;
$.inputHandler = Yd;
$.focusChangeEffect = Xd;
$.perLineTextDirection = Zd;
$.exceptionSink = Qd;
$.updateListener = Nl;
$.editable = Co;
$.mouseSelectionStyle = Jd;
$.dragMovesSelection = Gd;
$.clickAddsSelectionRange = Kd;
$.decorations = mr;
$.atomicRanges = mc;
$.bidiIsolatedRanges = ip;
$.scrollMargins = np;
$.darkTheme = Hl;
$.cspNonce = q.define({
    combine: (i)=>i.length ? i[0] : ""
});
$.contentAttributes = gc;
$.editorAttributes = tp;
$.lineWrapping = $.contentAttributes.of({
    class: "cm-lineWrapping"
});
$.announce = Z.define();
const hy = 4096, Bh = {};
class $s {
    constructor(e, t, n, r, s, o){
        this.from = e, this.to = t, this.dir = n, this.isolates = r, this.fresh = s, this.order = o;
    }
    static update(e, t) {
        if (t.empty && !e.some((s)=>s.fresh)) return e;
        let n = [], r = e.length ? e[e.length - 1].dir : ge.LTR;
        for(let s = Math.max(0, e.length - 10); s < e.length; s++){
            let o = e[s];
            o.dir == r && !t.touchesRange(o.from, o.to) && n.push(new $s(t.mapPos(o.from, 1), t.mapPos(o.to, -1), o.dir, o.isolates, !1, o.order));
        }
        return n;
    }
}
function Ih(i, e, t) {
    for(let n = i.state.facet(e), r = n.length - 1; r >= 0; r--){
        let s = n[r], o = typeof s == "function" ? s(i) : s;
        o && Al(o, t);
    }
    return t;
}
const uy = I.mac ? "mac" : I.windows ? "win" : I.linux ? "linux" : "key";
function fy(i, e) {
    const t = i.split(/-(?!$)/);
    let n = t[t.length - 1];
    n == "Space" && (n = " ");
    let r, s, o, l;
    for(let a = 0; a < t.length - 1; ++a){
        const c = t[a];
        if (/^(cmd|meta|m)$/i.test(c)) l = !0;
        else if (/^a(lt)?$/i.test(c)) r = !0;
        else if (/^(c|ctrl|control)$/i.test(c)) s = !0;
        else if (/^s(hift)?$/i.test(c)) o = !0;
        else if (/^mod$/i.test(c)) e == "mac" ? l = !0 : s = !0;
        else throw new Error("Unrecognized modifier name: " + c);
    }
    return r && (n = "Alt-" + n), s && (n = "Ctrl-" + n), l && (n = "Meta-" + n), o && (n = "Shift-" + n), n;
}
function ps(i, e, t) {
    return e.altKey && (i = "Alt-" + i), e.ctrlKey && (i = "Ctrl-" + i), e.metaKey && (i = "Meta-" + i), t !== !1 && e.shiftKey && (i = "Shift-" + i), i;
}
const dy = Mr.default($.domEventHandlers({
    keydown (i, e) {
        return yy(py(e.state), i, e, "editor");
    }
})), To = q.define({
    enables: dy
}), qh = new WeakMap;
function py(i) {
    let e = i.facet(To), t = qh.get(e);
    return t || qh.set(e, t = my(e.reduce((n, r)=>n.concat(r), []))), t;
}
let di = null;
const gy = 4e3;
function my(i, e = uy) {
    let t = Object.create(null), n = Object.create(null), r = (o, l)=>{
        let a = n[o];
        if (a == null) n[o] = l;
        else if (a != l) throw new Error("Key binding " + o + " is used both as a regular binding and as a multi-stroke prefix");
    }, s = (o, l, a, c, h)=>{
        var u, f;
        let d = t[o] || (t[o] = Object.create(null)), p = l.split(/ (?!$)/).map((k)=>fy(k, e));
        for(let k = 1; k < p.length; k++){
            let T = p.slice(0, k).join(" ");
            r(T, !0), d[T] || (d[T] = {
                preventDefault: !0,
                stopPropagation: !1,
                run: [
                    (D)=>{
                        let S = di = {
                            view: D,
                            prefix: T,
                            scope: o
                        };
                        return setTimeout(()=>{
                            di == S && (di = null);
                        }, gy), !0;
                    }
                ]
            });
        }
        let y = p.join(" ");
        r(y, !1);
        let b = d[y] || (d[y] = {
            preventDefault: !1,
            stopPropagation: !1,
            run: ((f = (u = d._any) === null || u === void 0 ? void 0 : u.run) === null || f === void 0 ? void 0 : f.slice()) || []
        });
        a && b.run.push(a), c && (b.preventDefault = !0), h && (b.stopPropagation = !0);
    };
    for (let o of i){
        let l = o.scope ? o.scope.split(" ") : [
            "editor"
        ];
        if (o.any) for (let c of l){
            let h = t[c] || (t[c] = Object.create(null));
            h._any || (h._any = {
                preventDefault: !1,
                stopPropagation: !1,
                run: []
            });
            for(let u in h)h[u].run.push(o.any);
        }
        let a = o[e] || o.key;
        if (a) for (let c of l)s(c, a, o.run, o.preventDefault, o.stopPropagation), o.shift && s(c, "Shift-" + a, o.shift, o.preventDefault, o.stopPropagation);
    }
    return t;
}
function yy(i, e, t, n) {
    let r = Fm(e), s = wt(r, 0), o = fi(s) == r.length && r != " ", l = "", a = !1, c = !1, h = !1;
    di && di.view == t && di.scope == n && (l = di.prefix + " ", pp.indexOf(e.keyCode) < 0 && (c = !0, di = null));
    let u = new Set, f = (b)=>{
        if (b) {
            for (let k of b.run)if (!u.has(k) && (u.add(k), k(t, e))) return b.stopPropagation && (h = !0), !0;
            b.preventDefault && (b.stopPropagation && (h = !0), c = !0);
        }
        return !1;
    }, d = i[n], p, y;
    return d && (f(d[l + ps(r, e, !o)]) ? a = !0 : o && (e.altKey || e.metaKey || e.ctrlKey) && !(I.windows && e.ctrlKey && e.altKey) && (p = Ri[e.keyCode]) && p != r ? (f(d[l + ps(p, e, !0)]) || e.shiftKey && (y = pr[e.keyCode]) != r && y != p && f(d[l + ps(y, e, !1)])) && (a = !0) : o && e.shiftKey && f(d[l + ps(r, e, !0)]) && (a = !0), !a && f(d._any) && (a = !0)), c && (a = !0), a && h && e.stopPropagation(), a;
}
class Nr {
    constructor(e, t, n, r, s){
        this.className = e, this.left = t, this.top = n, this.width = r, this.height = s;
    }
    draw() {
        let e = document.createElement("div");
        return e.className = this.className, this.adjust(e), e;
    }
    update(e, t) {
        return t.className != this.className ? !1 : (this.adjust(e), !0);
    }
    adjust(e) {
        e.style.left = this.left + "px", e.style.top = this.top + "px", this.width != null && (e.style.width = this.width + "px"), e.style.height = this.height + "px";
    }
    eq(e) {
        return this.left == e.left && this.top == e.top && this.width == e.width && this.height == e.height && this.className == e.className;
    }
    static forRange(e, t, n) {
        if (n.empty) {
            let r = e.coordsAtPos(n.head, n.assoc || 1);
            if (!r) return [];
            let s = Op(e);
            return [
                new Nr(t, r.left - s.left, r.top - s.top, null, r.bottom - r.top)
            ];
        } else return by(e, t, n);
    }
}
function Op(i) {
    let e = i.scrollDOM.getBoundingClientRect();
    return {
        left: (i.textDirection == ge.LTR ? e.left : e.right - i.scrollDOM.clientWidth * i.scaleX) - i.scrollDOM.scrollLeft * i.scaleX,
        top: e.top - i.scrollDOM.scrollTop * i.scaleY
    };
}
function jh(i, e, t) {
    let n = O.cursor(e);
    return {
        from: Math.max(t.from, i.moveToLineBoundary(n, !1, !0).from),
        to: Math.min(t.to, i.moveToLineBoundary(n, !0, !0).from),
        type: Ke.Text
    };
}
function by(i, e, t) {
    if (t.to <= i.viewport.from || t.from >= i.viewport.to) return [];
    let n = Math.max(t.from, i.viewport.from), r = Math.min(t.to, i.viewport.to), s = i.textDirection == ge.LTR, o = i.contentDOM, l = o.getBoundingClientRect(), a = Op(i), c = o.querySelector(".cm-line"), h = c && window.getComputedStyle(c), u = l.left + (h ? parseInt(h.paddingLeft) + Math.min(0, parseInt(h.textIndent)) : 0), f = l.right - (h ? parseInt(h.paddingRight) : 0), d = jl(i, n), p = jl(i, r), y = d.type == Ke.Text ? d : null, b = p.type == Ke.Text ? p : null;
    if (y && (i.lineWrapping || d.widgetLineBreaks) && (y = jh(i, n, y)), b && (i.lineWrapping || p.widgetLineBreaks) && (b = jh(i, r, b)), y && b && y.from == b.from) return T(D(t.from, t.to, y));
    {
        let x = y ? D(t.from, null, y) : S(d, !1), R = b ? D(null, t.to, b) : S(p, !0), E = [];
        return (y || d).to < (b || p).from - (y && b ? 1 : 0) || d.widgetLineBreaks > 1 && x.bottom + i.defaultLineHeight / 2 < R.top ? E.push(k(u, x.bottom, f, R.top)) : x.bottom < R.top && i.elementAtHeight((x.bottom + R.top) / 2).type == Ke.Text && (x.bottom = R.top = (x.bottom + R.top) / 2), T(x).concat(E).concat(T(R));
    }
    function k(x, R, E, K) {
        return new Nr(e, x - a.left, R - a.top - .01, E - x, K - R + .01);
    }
    function T({ top: x, bottom: R, horizontal: E }) {
        let K = [];
        for(let W = 0; W < E.length; W += 2)K.push(k(E[W], x, E[W + 1], R));
        return K;
    }
    function D(x, R, E) {
        let K = 1e9, W = -1000000000, U = [];
        function G(N, B, _, V, xe) {
            let ae = i.coordsAtPos(N, N == E.to ? -2 : 2), de = i.coordsAtPos(_, _ == E.from ? 2 : -2);
            !ae || !de || (K = Math.min(ae.top, de.top, K), W = Math.max(ae.bottom, de.bottom, W), xe == ge.LTR ? U.push(s && B ? u : ae.left, s && V ? f : de.right) : U.push(!s && V ? u : de.left, !s && B ? f : ae.right));
        }
        let L = x ?? E.from, v = R ?? E.to;
        for (let N of i.visibleRanges)if (N.to > L && N.from < v) for(let B = Math.max(N.from, L), _ = Math.min(N.to, v);;){
            let V = i.state.doc.lineAt(B);
            for (let xe of i.bidiSpans(V)){
                let ae = xe.from + V.from, de = xe.to + V.from;
                if (ae >= _) break;
                de > B && G(Math.max(ae, B), x == null && ae <= L, Math.min(de, _), R == null && de >= v, xe.dir);
            }
            if (B = V.to + 1, B >= _) break;
        }
        return U.length == 0 && G(L, x == null, v, R == null, i.textDirection), {
            top: K,
            bottom: W,
            horizontal: U
        };
    }
    function S(x, R) {
        let E = l.top + (R ? x.top : x.bottom);
        return {
            top: E,
            bottom: E,
            horizontal: []
        };
    }
}
function vy(i, e) {
    return i.constructor == e.constructor && i.eq(e);
}
class wy {
    constructor(e, t){
        this.view = e, this.layer = t, this.drawn = [], this.scaleX = 1, this.scaleY = 1, this.measureReq = {
            read: this.measure.bind(this),
            write: this.draw.bind(this)
        }, this.dom = e.scrollDOM.appendChild(document.createElement("div")), this.dom.classList.add("cm-layer"), t.above && this.dom.classList.add("cm-layer-above"), t.class && this.dom.classList.add(t.class), this.scale(), this.dom.setAttribute("aria-hidden", "true"), this.setOrder(e.state), e.requestMeasure(this.measureReq), t.mount && t.mount(this.dom, e);
    }
    update(e) {
        e.startState.facet(As) != e.state.facet(As) && this.setOrder(e.state), (this.layer.update(e, this.dom) || e.geometryChanged) && (this.scale(), e.view.requestMeasure(this.measureReq));
    }
    setOrder(e) {
        let t = 0, n = e.facet(As);
        for(; t < n.length && n[t] != this.layer;)t++;
        this.dom.style.zIndex = String((this.layer.above ? 150 : -1) - t);
    }
    measure() {
        return this.layer.markers(this.view);
    }
    scale() {
        let { scaleX: e, scaleY: t } = this.view;
        (e != this.scaleX || t != this.scaleY) && (this.scaleX = e, this.scaleY = t, this.dom.style.transform = `scale(${1 / e}, ${1 / t})`);
    }
    draw(e) {
        if (e.length != this.drawn.length || e.some((t, n)=>!vy(t, this.drawn[n]))) {
            let t = this.dom.firstChild, n = 0;
            for (let r of e)r.update && t && r.constructor && this.drawn[n].constructor && r.update(t, this.drawn[n]) ? (t = t.nextSibling, n++) : this.dom.insertBefore(r.draw(), t);
            for(; t;){
                let r = t.nextSibling;
                t.remove(), t = r;
            }
            this.drawn = e;
        }
    }
    destroy() {
        this.layer.destroy && this.layer.destroy(this.dom, this.view), this.dom.remove();
    }
}
const As = q.define();
function Dp(i) {
    return [
        Ie.define((e)=>new wy(e, i)),
        As.of(i)
    ];
}
const Pp = !I.ios, br = q.define({
    combine (i) {
        return En(i, {
            cursorBlinkRate: 1200,
            drawRangeCursor: !0
        }, {
            cursorBlinkRate: (e, t)=>Math.min(e, t),
            drawRangeCursor: (e, t)=>e || t
        });
    }
});
function ky(i = {}) {
    return [
        br.of(i),
        Sy,
        Cy,
        Ty,
        ep.of(!0)
    ];
}
function Mp(i) {
    return i.startState.facet(br) != i.state.facet(br);
}
const Sy = Dp({
    above: !0,
    markers (i) {
        let { state: e } = i, t = e.facet(br), n = [];
        for (let r of e.selection.ranges){
            let s = r == e.selection.main;
            if (r.empty ? !s || Pp : t.drawRangeCursor) {
                let o = s ? "cm-cursor cm-cursor-primary" : "cm-cursor cm-cursor-secondary", l = r.empty ? r : O.cursor(r.head, r.head > r.anchor ? -1 : 1);
                for (let a of Nr.forRange(i, o, l))n.push(a);
            }
        }
        return n;
    },
    update (i, e) {
        i.transactions.some((n)=>n.selection) && (e.style.animationName = e.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink");
        let t = Mp(i);
        return t && Fh(i.state, e), i.docChanged || i.selectionSet || t;
    },
    mount (i, e) {
        Fh(e.state, i);
    },
    class: "cm-cursorLayer"
});
function Fh(i, e) {
    e.style.animationDuration = i.facet(br).cursorBlinkRate + "ms";
}
const Cy = Dp({
    above: !1,
    markers (i) {
        return i.state.selection.ranges.map((e)=>e.empty ? [] : Nr.forRange(i, "cm-selectionBackground", e)).reduce((e, t)=>e.concat(t));
    },
    update (i, e) {
        return i.docChanged || i.selectionSet || i.viewportChanged || Mp(i);
    },
    class: "cm-selectionLayer"
}), Ap = {
    ".cm-line": {
        "& ::selection": {
            backgroundColor: "transparent !important"
        },
        "&::selection": {
            backgroundColor: "transparent !important"
        }
    }
};
Pp && (Ap[".cm-line"].caretColor = "transparent !important");
const Ty = Mr.highest($.theme(Ap));
function Hh(i, e, t, n, r) {
    e.lastIndex = 0;
    for(let s = i.iterRange(t, n), o = t, l; !s.next().done; o += s.value.length)if (!s.lineBreak) for(; l = e.exec(s.value);)r(o + l.index, l);
}
function xy(i, e) {
    let t = i.visibleRanges;
    if (t.length == 1 && t[0].from == i.viewport.from && t[0].to == i.viewport.to) return t;
    let n = [];
    for (let { from: r, to: s } of t)r = Math.max(i.state.doc.lineAt(r).from, r - e), s = Math.min(i.state.doc.lineAt(s).to, s + e), n.length && n[n.length - 1].to >= r ? n[n.length - 1].to = s : n.push({
        from: r,
        to: s
    });
    return n;
}
class Ry {
    constructor(e){
        const { regexp: t, decoration: n, decorate: r, boundary: s, maxLength: o = 1e3 } = e;
        if (!t.global) throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set");
        if (this.regexp = t, r) this.addMatch = (l, a, c, h)=>r(h, c, c + l[0].length, l, a);
        else if (typeof n == "function") this.addMatch = (l, a, c, h)=>{
            let u = n(l, a, c);
            u && h(c, c + l[0].length, u);
        };
        else if (n) this.addMatch = (l, a, c, h)=>h(c, c + l[0].length, n);
        else throw new RangeError("Either 'decorate' or 'decoration' should be provided to MatchDecorator");
        this.boundary = s, this.maxLength = o;
    }
    createDeco(e) {
        let t = new zi, n = t.add.bind(t);
        for (let { from: r, to: s } of xy(e, this.maxLength))Hh(e.state.doc, this.regexp, r, s, (o, l)=>this.addMatch(l, e, o, n));
        return t.finish();
    }
    updateDeco(e, t) {
        let n = 1e9, r = -1;
        return e.docChanged && e.changes.iterChanges((s, o, l, a)=>{
            a > e.view.viewport.from && l < e.view.viewport.to && (n = Math.min(l, n), r = Math.max(a, r));
        }), e.viewportChanged || r - n > 1e3 ? this.createDeco(e.view) : r > -1 ? this.updateRange(e.view, t.map(e.changes), n, r) : t;
    }
    updateRange(e, t, n, r) {
        for (let s of e.visibleRanges){
            let o = Math.max(s.from, n), l = Math.min(s.to, r);
            if (l > o) {
                let a = e.state.doc.lineAt(o), c = a.to < l ? e.state.doc.lineAt(l) : a, h = Math.max(s.from, a.from), u = Math.min(s.to, c.to);
                if (this.boundary) {
                    for(; o > a.from; o--)if (this.boundary.test(a.text[o - 1 - a.from])) {
                        h = o;
                        break;
                    }
                    for(; l < c.to; l++)if (this.boundary.test(c.text[l - c.from])) {
                        u = l;
                        break;
                    }
                }
                let f = [], d, p = (y, b, k)=>f.push(k.range(y, b));
                if (a == c) for(this.regexp.lastIndex = h - a.from; (d = this.regexp.exec(a.text)) && d.index < u - a.from;)this.addMatch(d, e, d.index + a.from, p);
                else Hh(e.state.doc, this.regexp, h, u, (y, b)=>this.addMatch(b, e, y, p));
                t = t.update({
                    filterFrom: h,
                    filterTo: u,
                    filter: (y, b)=>y < h || b > u,
                    add: f
                });
            }
        }
        return t;
    }
}
const $l = /x/.unicode != null ? "gu" : "g", Oy = new RegExp(`[\0-\b
-\x7f-\x9f\xad\u{61C}\u{200B}\u{200E}\u{200F}\u2028\u2029\u{202D}\u{202E}\u{2066}\u{2067}\u{2069}\uFEFF\u{FFF9}-\u{FFFC}]`, $l), Dy = {
    0: "null",
    7: "bell",
    8: "backspace",
    10: "newline",
    11: "vertical tab",
    13: "carriage return",
    27: "escape",
    8203: "zero width space",
    8204: "zero width non-joiner",
    8205: "zero width joiner",
    8206: "left-to-right mark",
    8207: "right-to-left mark",
    8232: "line separator",
    8237: "left-to-right override",
    8238: "right-to-left override",
    8294: "left-to-right isolate",
    8295: "right-to-left isolate",
    8297: "pop directional isolate",
    8233: "paragraph separator",
    65279: "zero width no-break space",
    65532: "object replacement"
};
let Qo = null;
function Py() {
    var i;
    if (Qo == null && typeof document < "u" && document.body) {
        let e = document.body.style;
        Qo = ((i = e.tabSize) !== null && i !== void 0 ? i : e.MozTabSize) != null;
    }
    return Qo || !1;
}
const _s = q.define({
    combine (i) {
        let e = En(i, {
            render: null,
            specialChars: Oy,
            addSpecialChars: null
        });
        return (e.replaceTabs = !Py()) && (e.specialChars = new RegExp("	|" + e.specialChars.source, $l)), e.addSpecialChars && (e.specialChars = new RegExp(e.specialChars.source + "|" + e.addSpecialChars.source, $l)), e;
    }
});
function My(i = {}) {
    return [
        _s.of(i),
        Ay()
    ];
}
let Wh = null;
function Ay() {
    return Wh || (Wh = Ie.fromClass(class {
        constructor(i){
            this.view = i, this.decorations = ee.none, this.decorationCache = Object.create(null), this.decorator = this.makeDecorator(i.state.facet(_s)), this.decorations = this.decorator.createDeco(i);
        }
        makeDecorator(i) {
            return new Ry({
                regexp: i.specialChars,
                decoration: (e, t, n)=>{
                    let { doc: r } = t.state, s = wt(e[0], 0);
                    if (s == 9) {
                        let o = r.lineAt(n), l = t.state.tabSize, a = Ar(o.text, l, n - o.from);
                        return ee.replace({
                            widget: new Ly((l - a % l) * this.view.defaultCharacterWidth / this.view.scaleX)
                        });
                    }
                    return this.decorationCache[s] || (this.decorationCache[s] = ee.replace({
                        widget: new Ny(i, s)
                    }));
                },
                boundary: i.replaceTabs ? void 0 : /[^]/
            });
        }
        update(i) {
            let e = i.state.facet(_s);
            i.startState.facet(_s) != e ? (this.decorator = this.makeDecorator(e), this.decorations = this.decorator.createDeco(i.view)) : this.decorations = this.decorator.updateDeco(i, this.decorations);
        }
    }, {
        decorations: (i)=>i.decorations
    }));
}
const _y = "\u2022";
function Ey(i) {
    return i >= 32 ? _y : i == 10 ? "\u2424" : String.fromCharCode(9216 + i);
}
class Ny extends li {
    constructor(e, t){
        super(), this.options = e, this.code = t;
    }
    eq(e) {
        return e.code == this.code;
    }
    toDOM(e) {
        let t = Ey(this.code), n = e.state.phrase("Control character") + " " + (Dy[this.code] || "0x" + this.code.toString(16)), r = this.options.render && this.options.render(this.code, n, t);
        if (r) return r;
        let s = document.createElement("span");
        return s.textContent = t, s.title = n, s.setAttribute("aria-label", n), s.className = "cm-specialChar", s;
    }
    ignoreEvent() {
        return !1;
    }
}
class Ly extends li {
    constructor(e){
        super(), this.width = e;
    }
    eq(e) {
        return e.width == this.width;
    }
    toDOM() {
        let e = document.createElement("span");
        return e.textContent = "	", e.className = "cm-tab", e.style.width = this.width + "px", e;
    }
    ignoreEvent() {
        return !1;
    }
}
class By extends li {
    constructor(e){
        super(), this.content = e;
    }
    toDOM() {
        let e = document.createElement("span");
        return e.className = "cm-placeholder", e.style.pointerEvents = "none", e.appendChild(typeof this.content == "string" ? document.createTextNode(this.content) : this.content), typeof this.content == "string" ? e.setAttribute("aria-label", "placeholder " + this.content) : e.setAttribute("aria-hidden", "true"), e;
    }
    coordsAt(e) {
        let t = e.firstChild ? gn(e.firstChild) : [];
        if (!t.length) return null;
        let n = window.getComputedStyle(e.parentNode), r = ko(t[0], n.direction != "rtl"), s = parseInt(n.lineHeight);
        return r.bottom - r.top > s * 1.5 ? {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.top + s
        } : r;
    }
    ignoreEvent() {
        return !1;
    }
}
function Iy(i) {
    return Ie.fromClass(class {
        constructor(e){
            this.view = e, this.placeholder = i ? ee.set([
                ee.widget({
                    widget: new By(i),
                    side: 1
                }).range(0)
            ]) : ee.none;
        }
        get decorations() {
            return this.view.state.doc.length ? ee.none : this.placeholder;
        }
    }, {
        decorations: (e)=>e.decorations
    });
}
const Yn = "-10000px";
class _p {
    constructor(e, t, n){
        this.facet = t, this.createTooltipView = n, this.input = e.state.facet(t), this.tooltips = this.input.filter((r)=>r), this.tooltipViews = this.tooltips.map(n);
    }
    update(e, t) {
        var n;
        let r = e.state.facet(this.facet), s = r.filter((a)=>a);
        if (r === this.input) {
            for (let a of this.tooltipViews)a.update && a.update(e);
            return !1;
        }
        let o = [], l = t ? [] : null;
        for(let a = 0; a < s.length; a++){
            let c = s[a], h = -1;
            if (c) {
                for(let u = 0; u < this.tooltips.length; u++){
                    let f = this.tooltips[u];
                    f && f.create == c.create && (h = u);
                }
                if (h < 0) o[a] = this.createTooltipView(c), l && (l[a] = !!c.above);
                else {
                    let u = o[a] = this.tooltipViews[h];
                    l && (l[a] = t[h]), u.update && u.update(e);
                }
            }
        }
        for (let a of this.tooltipViews)o.indexOf(a) < 0 && (a.dom.remove(), (n = a.destroy) === null || n === void 0 || n.call(a));
        return t && (l.forEach((a, c)=>t[c] = a), t.length = l.length), this.input = r, this.tooltips = s, this.tooltipViews = o, !0;
    }
}
function qy(i) {
    let { win: e } = i;
    return {
        top: 0,
        left: 0,
        bottom: e.innerHeight,
        right: e.innerWidth
    };
}
const Yo = q.define({
    combine: (i)=>{
        var e, t, n;
        return {
            position: I.ios ? "absolute" : ((e = i.find((r)=>r.position)) === null || e === void 0 ? void 0 : e.position) || "fixed",
            parent: ((t = i.find((r)=>r.parent)) === null || t === void 0 ? void 0 : t.parent) || null,
            tooltipSpace: ((n = i.find((r)=>r.tooltipSpace)) === null || n === void 0 ? void 0 : n.tooltipSpace) || qy
        };
    }
}), Vh = new WeakMap, Ep = Ie.fromClass(class {
    constructor(i){
        this.view = i, this.above = [], this.inView = !0, this.madeAbsolute = !1, this.lastTransaction = 0, this.measureTimeout = -1;
        let e = i.state.facet(Yo);
        this.position = e.position, this.parent = e.parent, this.classes = i.themeClasses, this.createContainer(), this.measureReq = {
            read: this.readMeasure.bind(this),
            write: this.writeMeasure.bind(this),
            key: this
        }, this.manager = new _p(i, bc, (t)=>this.createTooltip(t)), this.intersectionObserver = typeof IntersectionObserver == "function" ? new IntersectionObserver((t)=>{
            Date.now() > this.lastTransaction - 50 && t.length > 0 && t[t.length - 1].intersectionRatio < 1 && this.measureSoon();
        }, {
            threshold: [
                1
            ]
        }) : null, this.observeIntersection(), i.win.addEventListener("resize", this.measureSoon = this.measureSoon.bind(this)), this.maybeMeasure();
    }
    createContainer() {
        this.parent ? (this.container = document.createElement("div"), this.container.style.position = "relative", this.container.className = this.view.themeClasses, this.parent.appendChild(this.container)) : this.container = this.view.dom;
    }
    observeIntersection() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            for (let i of this.manager.tooltipViews)this.intersectionObserver.observe(i.dom);
        }
    }
    measureSoon() {
        this.measureTimeout < 0 && (this.measureTimeout = setTimeout(()=>{
            this.measureTimeout = -1, this.maybeMeasure();
        }, 50));
    }
    update(i) {
        i.transactions.length && (this.lastTransaction = Date.now());
        let e = this.manager.update(i, this.above);
        e && this.observeIntersection();
        let t = e || i.geometryChanged, n = i.state.facet(Yo);
        if (n.position != this.position && !this.madeAbsolute) {
            this.position = n.position;
            for (let r of this.manager.tooltipViews)r.dom.style.position = this.position;
            t = !0;
        }
        if (n.parent != this.parent) {
            this.parent && this.container.remove(), this.parent = n.parent, this.createContainer();
            for (let r of this.manager.tooltipViews)this.container.appendChild(r.dom);
            t = !0;
        } else this.parent && this.view.themeClasses != this.classes && (this.classes = this.container.className = this.view.themeClasses);
        t && this.maybeMeasure();
    }
    createTooltip(i) {
        let e = i.create(this.view);
        if (e.dom.classList.add("cm-tooltip"), i.arrow && !e.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow")) {
            let t = document.createElement("div");
            t.className = "cm-tooltip-arrow", e.dom.appendChild(t);
        }
        return e.dom.style.position = this.position, e.dom.style.top = Yn, e.dom.style.left = "0px", this.container.appendChild(e.dom), e.mount && e.mount(this.view), e;
    }
    destroy() {
        var i, e;
        this.view.win.removeEventListener("resize", this.measureSoon);
        for (let t of this.manager.tooltipViews)t.dom.remove(), (i = t.destroy) === null || i === void 0 || i.call(t);
        this.parent && this.container.remove(), (e = this.intersectionObserver) === null || e === void 0 || e.disconnect(), clearTimeout(this.measureTimeout);
    }
    readMeasure() {
        let i = this.view.dom.getBoundingClientRect(), e = 1, t = 1, n = !1;
        if (this.position == "fixed" && this.manager.tooltipViews.length) {
            let { dom: r } = this.manager.tooltipViews[0];
            if (I.gecko) n = r.offsetParent != this.container.ownerDocument.body;
            else if (this.view.scaleX != 1 || this.view.scaleY != 1) n = !0;
            else if (r.style.top == Yn && r.style.left == "0px") {
                let s = r.getBoundingClientRect();
                n = Math.abs(s.top + 1e4) > 1 || Math.abs(s.left) > 1;
            }
        }
        if (n || this.position == "absolute") {
            if (this.parent) {
                let r = this.parent.getBoundingClientRect();
                r.width && r.height && (e = r.width / this.parent.offsetWidth, t = r.height / this.parent.offsetHeight);
            } else ({ scaleX: e, scaleY: t } = this.view.viewState);
        }
        return {
            editor: i,
            parent: this.parent ? this.container.getBoundingClientRect() : i,
            pos: this.manager.tooltips.map((r, s)=>{
                let o = this.manager.tooltipViews[s];
                return o.getCoords ? o.getCoords(r.pos) : this.view.coordsAtPos(r.pos);
            }),
            size: this.manager.tooltipViews.map(({ dom: r })=>r.getBoundingClientRect()),
            space: this.view.state.facet(Yo).tooltipSpace(this.view),
            scaleX: e,
            scaleY: t,
            makeAbsolute: n
        };
    }
    writeMeasure(i) {
        var e;
        if (i.makeAbsolute) {
            this.madeAbsolute = !0, this.position = "absolute";
            for (let l of this.manager.tooltipViews)l.dom.style.position = "absolute";
        }
        let { editor: t, space: n, scaleX: r, scaleY: s } = i, o = [];
        for(let l = 0; l < this.manager.tooltips.length; l++){
            let a = this.manager.tooltips[l], c = this.manager.tooltipViews[l], { dom: h } = c, u = i.pos[l], f = i.size[l];
            if (!u || u.bottom <= Math.max(t.top, n.top) || u.top >= Math.min(t.bottom, n.bottom) || u.right < Math.max(t.left, n.left) - .1 || u.left > Math.min(t.right, n.right) + .1) {
                h.style.top = Yn;
                continue;
            }
            let d = a.arrow ? c.dom.querySelector(".cm-tooltip-arrow") : null, p = d ? 7 : 0, y = f.right - f.left, b = (e = Vh.get(c)) !== null && e !== void 0 ? e : f.bottom - f.top, k = c.offset || Fy, T = this.view.textDirection == ge.LTR, D = f.width > n.right - n.left ? T ? n.left : n.right - f.width : T ? Math.min(u.left - (d ? 14 : 0) + k.x, n.right - y) : Math.max(n.left, u.left - y + (d ? 14 : 0) - k.x), S = this.above[l];
            !a.strictSide && (S ? u.top - (f.bottom - f.top) - k.y < n.top : u.bottom + (f.bottom - f.top) + k.y > n.bottom) && S == n.bottom - u.bottom > u.top - n.top && (S = this.above[l] = !S);
            let x = (S ? u.top - n.top : n.bottom - u.bottom) - p;
            if (x < b && c.resize !== !1) {
                if (x < this.view.defaultLineHeight) {
                    h.style.top = Yn;
                    continue;
                }
                Vh.set(c, b), h.style.height = (b = x) / s + "px";
            } else h.style.height && (h.style.height = "");
            let R = S ? u.top - b - p - k.y : u.bottom + p + k.y, E = D + y;
            if (c.overlap !== !0) for (let K of o)K.left < E && K.right > D && K.top < R + b && K.bottom > R && (R = S ? K.top - b - 2 - p : K.bottom + p + 2);
            if (this.position == "absolute" ? (h.style.top = (R - i.parent.top) / s + "px", h.style.left = (D - i.parent.left) / r + "px") : (h.style.top = R / s + "px", h.style.left = D / r + "px"), d) {
                let K = u.left + (T ? k.x : -k.x) - (D + 14 - 7);
                d.style.left = K / r + "px";
            }
            c.overlap !== !0 && o.push({
                left: D,
                top: R,
                right: E,
                bottom: R + b
            }), h.classList.toggle("cm-tooltip-above", S), h.classList.toggle("cm-tooltip-below", !S), c.positioned && c.positioned(i.space);
        }
    }
    maybeMeasure() {
        if (this.manager.tooltips.length && (this.view.inView && this.view.requestMeasure(this.measureReq), this.inView != this.view.inView && (this.inView = this.view.inView, !this.inView))) for (let i of this.manager.tooltipViews)i.dom.style.top = Yn;
    }
}, {
    eventObservers: {
        scroll () {
            this.maybeMeasure();
        }
    }
}), jy = $.baseTheme({
    ".cm-tooltip": {
        zIndex: 100,
        boxSizing: "border-box"
    },
    "&light .cm-tooltip": {
        border: "1px solid #bbb",
        backgroundColor: "#f5f5f5"
    },
    "&light .cm-tooltip-section:not(:first-child)": {
        borderTop: "1px solid #bbb"
    },
    "&dark .cm-tooltip": {
        backgroundColor: "#333338",
        color: "white"
    },
    ".cm-tooltip-arrow": {
        height: "7px",
        width: `${14}px`,
        position: "absolute",
        zIndex: -1,
        overflow: "hidden",
        "&:before, &:after": {
            content: "''",
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent"
        },
        ".cm-tooltip-above &": {
            bottom: "-7px",
            "&:before": {
                borderTop: "7px solid #bbb"
            },
            "&:after": {
                borderTop: "7px solid #f5f5f5",
                bottom: "1px"
            }
        },
        ".cm-tooltip-below &": {
            top: "-7px",
            "&:before": {
                borderBottom: "7px solid #bbb"
            },
            "&:after": {
                borderBottom: "7px solid #f5f5f5",
                top: "1px"
            }
        }
    },
    "&dark .cm-tooltip .cm-tooltip-arrow": {
        "&:before": {
            borderTopColor: "#333338",
            borderBottomColor: "#333338"
        },
        "&:after": {
            borderTopColor: "transparent",
            borderBottomColor: "transparent"
        }
    }
}), Fy = {
    x: 0,
    y: 0
}, bc = q.define({
    enables: [
        Ep,
        jy
    ]
}), zs = q.define();
class vc {
    static create(e) {
        return new vc(e);
    }
    constructor(e){
        this.view = e, this.mounted = !1, this.dom = document.createElement("div"), this.dom.classList.add("cm-tooltip-hover"), this.manager = new _p(e, zs, (t)=>this.createHostedView(t));
    }
    createHostedView(e) {
        let t = e.create(this.view);
        return t.dom.classList.add("cm-tooltip-section"), this.dom.appendChild(t.dom), this.mounted && t.mount && t.mount(this.view), t;
    }
    mount(e) {
        for (let t of this.manager.tooltipViews)t.mount && t.mount(e);
        this.mounted = !0;
    }
    positioned(e) {
        for (let t of this.manager.tooltipViews)t.positioned && t.positioned(e);
    }
    update(e) {
        this.manager.update(e);
    }
    destroy() {
        var e;
        for (let t of this.manager.tooltipViews)(e = t.destroy) === null || e === void 0 || e.call(t);
    }
    passProp(e) {
        let t;
        for (let n of this.manager.tooltipViews){
            let r = n[e];
            if (r !== void 0) {
                if (t === void 0) t = r;
                else if (t !== r) return;
            }
        }
        return t;
    }
    get offset() {
        return this.passProp("offset");
    }
    get getCoords() {
        return this.passProp("getCoords");
    }
    get overlap() {
        return this.passProp("overlap");
    }
    get resize() {
        return this.passProp("resize");
    }
}
const Hy = bc.compute([
    zs
], (i)=>{
    let e = i.facet(zs).filter((t)=>t);
    return e.length === 0 ? null : {
        pos: Math.min(...e.map((t)=>t.pos)),
        end: Math.max(...e.filter((t)=>t.end != null).map((t)=>t.end)),
        create: vc.create,
        above: e[0].above,
        arrow: e.some((t)=>t.arrow)
    };
});
class Wy {
    constructor(e, t, n, r, s){
        this.view = e, this.source = t, this.field = n, this.setHover = r, this.hoverTime = s, this.hoverTimeout = -1, this.restartTimeout = -1, this.pending = null, this.lastMove = {
            x: 0,
            y: 0,
            target: e.dom,
            time: 0
        }, this.checkHover = this.checkHover.bind(this), e.dom.addEventListener("mouseleave", this.mouseleave = this.mouseleave.bind(this)), e.dom.addEventListener("mousemove", this.mousemove = this.mousemove.bind(this));
    }
    update() {
        this.pending && (this.pending = null, clearTimeout(this.restartTimeout), this.restartTimeout = setTimeout(()=>this.startHover(), 20));
    }
    get active() {
        return this.view.state.field(this.field);
    }
    checkHover() {
        if (this.hoverTimeout = -1, this.active) return;
        let e = Date.now() - this.lastMove.time;
        e < this.hoverTime ? this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - e) : this.startHover();
    }
    startHover() {
        clearTimeout(this.restartTimeout);
        let { view: e, lastMove: t } = this, n = e.docView.nearest(t.target);
        if (!n) return;
        let r, s = 1;
        if (n instanceof gi) r = n.posAtStart;
        else {
            if (r = e.posAtCoords(t), r == null) return;
            let l = e.coordsAtPos(r);
            if (!l || t.y < l.top || t.y > l.bottom || t.x < l.left - e.defaultCharacterWidth || t.x > l.right + e.defaultCharacterWidth) return;
            let a = e.bidiSpans(e.state.doc.lineAt(r)).find((h)=>h.from <= r && h.to >= r), c = a && a.dir == ge.RTL ? -1 : 1;
            s = t.x < l.left ? -c : c;
        }
        let o = this.source(e, r, s);
        if (o != null && o.then) {
            let l = this.pending = {
                pos: r
            };
            o.then((a)=>{
                this.pending == l && (this.pending = null, a && e.dispatch({
                    effects: this.setHover.of(a)
                }));
            }, (a)=>Tt(e.state, a, "hover tooltip"));
        } else o && e.dispatch({
            effects: this.setHover.of(o)
        });
    }
    mousemove(e) {
        var t;
        this.lastMove = {
            x: e.clientX,
            y: e.clientY,
            target: e.target,
            time: Date.now()
        }, this.hoverTimeout < 0 && (this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime));
        let n = this.active;
        if (n && !$h(this.lastMove.target) || this.pending) {
            let { pos: r } = n || this.pending, s = (t = n == null ? void 0 : n.end) !== null && t !== void 0 ? t : r;
            (r == s ? this.view.posAtCoords(this.lastMove) != r : !Vy(this.view, r, s, e.clientX, e.clientY)) && (this.view.dispatch({
                effects: this.setHover.of(null)
            }), this.pending = null);
        }
    }
    mouseleave(e) {
        clearTimeout(this.hoverTimeout), this.hoverTimeout = -1, this.active && !$h(e.relatedTarget) && this.view.dispatch({
            effects: this.setHover.of(null)
        });
    }
    destroy() {
        clearTimeout(this.hoverTimeout), this.view.dom.removeEventListener("mouseleave", this.mouseleave), this.view.dom.removeEventListener("mousemove", this.mousemove);
    }
}
function $h(i) {
    for(let e = i; e; e = e.parentNode)if (e.nodeType == 1 && e.classList.contains("cm-tooltip")) return !0;
    return !1;
}
function Vy(i, e, t, n, r, s) {
    let o = i.scrollDOM.getBoundingClientRect(), l = i.documentTop + i.documentPadding.top + i.contentHeight;
    if (o.left > n || o.right < n || o.top > r || Math.min(o.bottom, l) < r) return !1;
    let a = i.posAtCoords({
        x: n,
        y: r
    }, !1);
    return a >= e && a <= t;
}
function Np(i, e = {}) {
    let t = Z.define(), n = pt.define({
        create () {
            return null;
        },
        update (r, s) {
            if (r && (e.hideOnChange && (s.docChanged || s.selection) || e.hideOn && e.hideOn(s, r))) return null;
            if (r && s.docChanged) {
                let o = s.changes.mapPos(r.pos, -1, Ye.TrackDel);
                if (o == null) return null;
                let l = Object.assign(Object.create(null), r);
                l.pos = o, r.end != null && (l.end = s.changes.mapPos(r.end)), r = l;
            }
            for (let o of s.effects)o.is(t) && (r = o.value), o.is($y) && (r = null);
            return r;
        },
        provide: (r)=>zs.from(r)
    });
    return [
        n,
        Ie.define((r)=>new Wy(r, i, n, t, e.hoverTime || 300)),
        Hy
    ];
}
function Lp(i, e) {
    let t = i.plugin(Ep);
    if (!t) return null;
    let n = t.manager.tooltips.indexOf(e);
    return n < 0 ? null : t.manager.tooltipViews[n];
}
const $y = Z.define(), zh = q.define({
    combine (i) {
        let e, t;
        for (let n of i)e = e || n.topContainer, t = t || n.bottomContainer;
        return {
            topContainer: e,
            bottomContainer: t
        };
    }
}), zy = Ie.fromClass(class {
    constructor(i){
        this.input = i.state.facet(zl), this.specs = this.input.filter((t)=>t), this.panels = this.specs.map((t)=>t(i));
        let e = i.state.facet(zh);
        this.top = new gs(i, !0, e.topContainer), this.bottom = new gs(i, !1, e.bottomContainer), this.top.sync(this.panels.filter((t)=>t.top)), this.bottom.sync(this.panels.filter((t)=>!t.top));
        for (let t of this.panels)t.dom.classList.add("cm-panel"), t.mount && t.mount();
    }
    update(i) {
        let e = i.state.facet(zh);
        this.top.container != e.topContainer && (this.top.sync([]), this.top = new gs(i.view, !0, e.topContainer)), this.bottom.container != e.bottomContainer && (this.bottom.sync([]), this.bottom = new gs(i.view, !1, e.bottomContainer)), this.top.syncClasses(), this.bottom.syncClasses();
        let t = i.state.facet(zl);
        if (t != this.input) {
            let n = t.filter((a)=>a), r = [], s = [], o = [], l = [];
            for (let a of n){
                let c = this.specs.indexOf(a), h;
                c < 0 ? (h = a(i.view), l.push(h)) : (h = this.panels[c], h.update && h.update(i)), r.push(h), (h.top ? s : o).push(h);
            }
            this.specs = n, this.panels = r, this.top.sync(s), this.bottom.sync(o);
            for (let a of l)a.dom.classList.add("cm-panel"), a.mount && a.mount();
        } else for (let n of this.panels)n.update && n.update(i);
    }
    destroy() {
        this.top.sync([]), this.bottom.sync([]);
    }
}, {
    provide: (i)=>$.scrollMargins.of((e)=>{
            let t = e.plugin(i);
            return t && {
                top: t.top.scrollMargin(),
                bottom: t.bottom.scrollMargin()
            };
        })
});
class gs {
    constructor(e, t, n){
        this.view = e, this.top = t, this.container = n, this.dom = void 0, this.classes = "", this.panels = [], this.syncClasses();
    }
    sync(e) {
        for (let t of this.panels)t.destroy && e.indexOf(t) < 0 && t.destroy();
        this.panels = e, this.syncDOM();
    }
    syncDOM() {
        if (this.panels.length == 0) {
            this.dom && (this.dom.remove(), this.dom = void 0);
            return;
        }
        if (!this.dom) {
            this.dom = document.createElement("div"), this.dom.className = this.top ? "cm-panels cm-panels-top" : "cm-panels cm-panels-bottom", this.dom.style[this.top ? "top" : "bottom"] = "0";
            let t = this.container || this.view.dom;
            t.insertBefore(this.dom, this.top ? t.firstChild : null);
        }
        let e = this.dom.firstChild;
        for (let t of this.panels)if (t.dom.parentNode == this.dom) {
            for(; e != t.dom;)e = Uh(e);
            e = e.nextSibling;
        } else this.dom.insertBefore(t.dom, e);
        for(; e;)e = Uh(e);
    }
    scrollMargin() {
        return !this.dom || this.container ? 0 : Math.max(0, this.top ? this.dom.getBoundingClientRect().bottom - Math.max(0, this.view.scrollDOM.getBoundingClientRect().top) : Math.min(innerHeight, this.view.scrollDOM.getBoundingClientRect().bottom) - this.dom.getBoundingClientRect().top);
    }
    syncClasses() {
        if (!(!this.container || this.classes == this.view.themeClasses)) {
            for (let e of this.classes.split(" "))e && this.container.classList.remove(e);
            for (let e of (this.classes = this.view.themeClasses).split(" "))e && this.container.classList.add(e);
        }
    }
}
function Uh(i) {
    let e = i.nextSibling;
    return i.remove(), e;
}
const zl = q.define({
    enables: zy
});
class Ki extends $i {
    compare(e) {
        return this == e || this.constructor == e.constructor && this.eq(e);
    }
    eq(e) {
        return !1;
    }
    destroy(e) {}
}
Ki.prototype.elementClass = "";
Ki.prototype.toDOM = void 0;
Ki.prototype.mapMode = Ye.TrackBefore;
Ki.prototype.startSide = Ki.prototype.endSide = -1;
Ki.prototype.point = !0;
const Xo = q.define(), Uy = {
    class: "",
    renderEmptyElements: !1,
    elementStyle: "",
    markers: ()=>le.empty,
    lineMarker: ()=>null,
    widgetMarker: ()=>null,
    lineMarkerChange: null,
    initialSpacer: null,
    updateSpacer: null,
    domEventHandlers: {}
}, Es = q.define();
function Ky(i) {
    return [
        Gy(),
        Es.of(Object.assign(Object.assign({}, Uy), i))
    ];
}
const Ul = q.define({
    combine: (i)=>i.some((e)=>e)
});
function Gy(i) {
    let e = [
        Jy
    ];
    return i && i.fixed === !1 && e.push(Ul.of(!0)), e;
}
const Jy = Ie.fromClass(class {
    constructor(i){
        this.view = i, this.prevViewport = i.viewport, this.dom = document.createElement("div"), this.dom.className = "cm-gutters", this.dom.setAttribute("aria-hidden", "true"), this.dom.style.minHeight = this.view.contentHeight / this.view.scaleY + "px", this.gutters = i.state.facet(Es).map((e)=>new Gh(i, e));
        for (let e of this.gutters)this.dom.appendChild(e.dom);
        this.fixed = !i.state.facet(Ul), this.fixed && (this.dom.style.position = "sticky"), this.syncGutters(!1), i.scrollDOM.insertBefore(this.dom, i.contentDOM);
    }
    update(i) {
        if (this.updateGutters(i)) {
            let e = this.prevViewport, t = i.view.viewport, n = Math.min(e.to, t.to) - Math.max(e.from, t.from);
            this.syncGutters(n < (t.to - t.from) * .8);
        }
        i.geometryChanged && (this.dom.style.minHeight = this.view.contentHeight + "px"), this.view.state.facet(Ul) != !this.fixed && (this.fixed = !this.fixed, this.dom.style.position = this.fixed ? "sticky" : ""), this.prevViewport = i.view.viewport;
    }
    syncGutters(i) {
        let e = this.dom.nextSibling;
        i && this.dom.remove();
        let t = le.iter(this.view.state.facet(Xo), this.view.viewport.from), n = [], r = this.gutters.map((s)=>new Qy(s, this.view.viewport, -this.view.documentPadding.top));
        for (let s of this.view.viewportLineBlocks)if (n.length && (n = []), Array.isArray(s.type)) {
            let o = !0;
            for (let l of s.type)if (l.type == Ke.Text && o) {
                Kl(t, n, l.from);
                for (let a of r)a.line(this.view, l, n);
                o = !1;
            } else if (l.widget) for (let a of r)a.widget(this.view, l);
        } else if (s.type == Ke.Text) {
            Kl(t, n, s.from);
            for (let o of r)o.line(this.view, s, n);
        } else if (s.widget) for (let o of r)o.widget(this.view, s);
        for (let s of r)s.finish();
        i && this.view.scrollDOM.insertBefore(this.dom, e);
    }
    updateGutters(i) {
        let e = i.startState.facet(Es), t = i.state.facet(Es), n = i.docChanged || i.heightChanged || i.viewportChanged || !le.eq(i.startState.facet(Xo), i.state.facet(Xo), i.view.viewport.from, i.view.viewport.to);
        if (e == t) for (let r of this.gutters)r.update(i) && (n = !0);
        else {
            n = !0;
            let r = [];
            for (let s of t){
                let o = e.indexOf(s);
                o < 0 ? r.push(new Gh(this.view, s)) : (this.gutters[o].update(i), r.push(this.gutters[o]));
            }
            for (let s of this.gutters)s.dom.remove(), r.indexOf(s) < 0 && s.destroy();
            for (let s of r)this.dom.appendChild(s.dom);
            this.gutters = r;
        }
        return n;
    }
    destroy() {
        for (let i of this.gutters)i.destroy();
        this.dom.remove();
    }
}, {
    provide: (i)=>$.scrollMargins.of((e)=>{
            let t = e.plugin(i);
            return !t || t.gutters.length == 0 || !t.fixed ? null : e.textDirection == ge.LTR ? {
                left: t.dom.offsetWidth * e.scaleX
            } : {
                right: t.dom.offsetWidth * e.scaleX
            };
        })
});
function Kh(i) {
    return Array.isArray(i) ? i : [
        i
    ];
}
function Kl(i, e, t) {
    for(; i.value && i.from <= t;)i.from == t && e.push(i.value), i.next();
}
class Qy {
    constructor(e, t, n){
        this.gutter = e, this.height = n, this.i = 0, this.cursor = le.iter(e.markers, t.from);
    }
    addElement(e, t, n) {
        let { gutter: r } = this, s = (t.top - this.height) / e.scaleY, o = t.height / e.scaleY;
        if (this.i == r.elements.length) {
            let l = new Bp(e, o, s, n);
            r.elements.push(l), r.dom.appendChild(l.dom);
        } else r.elements[this.i].update(e, o, s, n);
        this.height = t.bottom, this.i++;
    }
    line(e, t, n) {
        let r = [];
        Kl(this.cursor, r, t.from), n.length && (r = r.concat(n));
        let s = this.gutter.config.lineMarker(e, t, r);
        s && r.unshift(s);
        let o = this.gutter;
        r.length == 0 && !o.config.renderEmptyElements || this.addElement(e, t, r);
    }
    widget(e, t) {
        let n = this.gutter.config.widgetMarker(e, t.widget, t);
        n && this.addElement(e, t, [
            n
        ]);
    }
    finish() {
        let e = this.gutter;
        for(; e.elements.length > this.i;){
            let t = e.elements.pop();
            e.dom.removeChild(t.dom), t.destroy();
        }
    }
}
class Gh {
    constructor(e, t){
        this.view = e, this.config = t, this.elements = [], this.spacer = null, this.dom = document.createElement("div"), this.dom.className = "cm-gutter" + (this.config.class ? " " + this.config.class : "");
        for(let n in t.domEventHandlers)this.dom.addEventListener(n, (r)=>{
            let s = r.target, o;
            if (s != this.dom && this.dom.contains(s)) {
                for(; s.parentNode != this.dom;)s = s.parentNode;
                let a = s.getBoundingClientRect();
                o = (a.top + a.bottom) / 2;
            } else o = r.clientY;
            let l = e.lineBlockAtHeight(o - e.documentTop);
            t.domEventHandlers[n](e, l, r) && r.preventDefault();
        });
        this.markers = Kh(t.markers(e)), t.initialSpacer && (this.spacer = new Bp(e, 0, 0, [
            t.initialSpacer(e)
        ]), this.dom.appendChild(this.spacer.dom), this.spacer.dom.style.cssText += "visibility: hidden; pointer-events: none");
    }
    update(e) {
        let t = this.markers;
        if (this.markers = Kh(this.config.markers(e.view)), this.spacer && this.config.updateSpacer) {
            let r = this.config.updateSpacer(this.spacer.markers[0], e);
            r != this.spacer.markers[0] && this.spacer.update(e.view, 0, 0, [
                r
            ]);
        }
        let n = e.view.viewport;
        return !le.eq(this.markers, t, n.from, n.to) || (this.config.lineMarkerChange ? this.config.lineMarkerChange(e) : !1);
    }
    destroy() {
        for (let e of this.elements)e.destroy();
    }
}
class Bp {
    constructor(e, t, n, r){
        this.height = -1, this.above = 0, this.markers = [], this.dom = document.createElement("div"), this.dom.className = "cm-gutterElement", this.update(e, t, n, r);
    }
    update(e, t, n, r) {
        this.height != t && (this.height = t, this.dom.style.height = t + "px"), this.above != n && (this.dom.style.marginTop = (this.above = n) ? n + "px" : ""), Yy(this.markers, r) || this.setMarkers(e, r);
    }
    setMarkers(e, t) {
        let n = "cm-gutterElement", r = this.dom.firstChild;
        for(let s = 0, o = 0;;){
            let l = o, a = s < t.length ? t[s++] : null, c = !1;
            if (a) {
                let h = a.elementClass;
                h && (n += " " + h);
                for(let u = o; u < this.markers.length; u++)if (this.markers[u].compare(a)) {
                    l = u, c = !0;
                    break;
                }
            } else l = this.markers.length;
            for(; o < l;){
                let h = this.markers[o++];
                if (h.toDOM) {
                    h.destroy(r);
                    let u = r.nextSibling;
                    r.remove(), r = u;
                }
            }
            if (!a) break;
            a.toDOM && (c ? r = r.nextSibling : this.dom.insertBefore(a.toDOM(e), r)), c && o++;
        }
        this.dom.className = n, this.markers = t;
    }
    destroy() {
        this.setMarkers(null, []);
    }
}
function Yy(i, e) {
    if (i.length != e.length) return !1;
    for(let t = 0; t < i.length; t++)if (!i[t].compare(e[t])) return !1;
    return !0;
}
const Ip = 1024;
let Xy = 0, Zo = class {
    constructor(e, t){
        this.from = e, this.to = t;
    }
};
class Q {
    constructor(e = {}){
        this.id = Xy++, this.perNode = !!e.perNode, this.deserialize = e.deserialize || (()=>{
            throw new Error("This node type doesn't define a deserialize function");
        });
    }
    add(e) {
        if (this.perNode) throw new RangeError("Can't add per-node props to node types");
        return typeof e != "function" && (e = et.match(e)), (t)=>{
            let n = e(t);
            return n === void 0 ? null : [
                this,
                n
            ];
        };
    }
}
Q.closedBy = new Q({
    deserialize: (i)=>i.split(" ")
});
Q.openedBy = new Q({
    deserialize: (i)=>i.split(" ")
});
Q.group = new Q({
    deserialize: (i)=>i.split(" ")
});
Q.contextHash = new Q({
    perNode: !0
});
Q.lookAhead = new Q({
    perNode: !0
});
Q.mounted = new Q({
    perNode: !0
});
class Us {
    constructor(e, t, n){
        this.tree = e, this.overlay = t, this.parser = n;
    }
    static get(e) {
        return e && e.props && e.props[Q.mounted.id];
    }
}
const Zy = Object.create(null);
class et {
    constructor(e, t, n, r = 0){
        this.name = e, this.props = t, this.id = n, this.flags = r;
    }
    static define(e) {
        let t = e.props && e.props.length ? Object.create(null) : Zy, n = (e.top ? 1 : 0) | (e.skipped ? 2 : 0) | (e.error ? 4 : 0) | (e.name == null ? 8 : 0), r = new et(e.name || "", t, e.id, n);
        if (e.props) {
            for (let s of e.props)if (Array.isArray(s) || (s = s(r)), s) {
                if (s[0].perNode) throw new RangeError("Can't store a per-node prop on a node type");
                t[s[0].id] = s[1];
            }
        }
        return r;
    }
    prop(e) {
        return this.props[e.id];
    }
    get isTop() {
        return (this.flags & 1) > 0;
    }
    get isSkipped() {
        return (this.flags & 2) > 0;
    }
    get isError() {
        return (this.flags & 4) > 0;
    }
    get isAnonymous() {
        return (this.flags & 8) > 0;
    }
    is(e) {
        if (typeof e == "string") {
            if (this.name == e) return !0;
            let t = this.prop(Q.group);
            return t ? t.indexOf(e) > -1 : !1;
        }
        return this.id == e;
    }
    static match(e) {
        let t = Object.create(null);
        for(let n in e)for (let r of n.split(" "))t[r] = e[n];
        return (n)=>{
            for(let r = n.prop(Q.group), s = -1; s < (r ? r.length : 0); s++){
                let o = t[s < 0 ? n.name : r[s]];
                if (o) return o;
            }
        };
    }
}
et.none = new et("", Object.create(null), 0, 8);
class wc {
    constructor(e){
        this.types = e;
        for(let t = 0; t < e.length; t++)if (e[t].id != t) throw new RangeError("Node type ids should correspond to array positions when creating a node set");
    }
    extend(...e) {
        let t = [];
        for (let n of this.types){
            let r = null;
            for (let s of e){
                let o = s(n);
                o && (r || (r = Object.assign({}, n.props)), r[o[0].id] = o[1]);
            }
            t.push(r ? new et(n.name, r, n.id, n.flags) : n);
        }
        return new wc(t);
    }
}
const ms = new WeakMap, Jh = new WeakMap;
var Ae;
(function(i) {
    i[i.ExcludeBuffers = 1] = "ExcludeBuffers", i[i.IncludeAnonymous = 2] = "IncludeAnonymous", i[i.IgnoreMounts = 4] = "IgnoreMounts", i[i.IgnoreOverlays = 8] = "IgnoreOverlays";
})(Ae || (Ae = {}));
class Te {
    constructor(e, t, n, r, s){
        if (this.type = e, this.children = t, this.positions = n, this.length = r, this.props = null, s && s.length) {
            this.props = Object.create(null);
            for (let [o, l] of s)this.props[typeof o == "number" ? o : o.id] = l;
        }
    }
    toString() {
        let e = Us.get(this);
        if (e && !e.overlay) return e.tree.toString();
        let t = "";
        for (let n of this.children){
            let r = n.toString();
            r && (t && (t += ","), t += r);
        }
        return this.type.name ? (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (t.length ? "(" + t + ")" : "") : t;
    }
    cursor(e = 0) {
        return new Jl(this.topNode, e);
    }
    cursorAt(e, t = 0, n = 0) {
        let r = ms.get(this) || this.topNode, s = new Jl(r);
        return s.moveTo(e, t), ms.set(this, s._tree), s;
    }
    get topNode() {
        return new ft(this, 0, 0, null);
    }
    resolve(e, t = 0) {
        let n = vr(ms.get(this) || this.topNode, e, t, !1);
        return ms.set(this, n), n;
    }
    resolveInner(e, t = 0) {
        let n = vr(Jh.get(this) || this.topNode, e, t, !0);
        return Jh.set(this, n), n;
    }
    resolveStack(e, t = 0) {
        return ib(this, e, t);
    }
    iterate(e) {
        let { enter: t, leave: n, from: r = 0, to: s = this.length } = e, o = e.mode || 0, l = (o & Ae.IncludeAnonymous) > 0;
        for(let a = this.cursor(o | Ae.IncludeAnonymous);;){
            let c = !1;
            if (a.from <= s && a.to >= r && (!l && a.type.isAnonymous || t(a) !== !1)) {
                if (a.firstChild()) continue;
                c = !0;
            }
            for(; c && n && (l || !a.type.isAnonymous) && n(a), !a.nextSibling();){
                if (!a.parent()) return;
                c = !0;
            }
        }
    }
    prop(e) {
        return e.perNode ? this.props ? this.props[e.id] : void 0 : this.type.prop(e);
    }
    get propValues() {
        let e = [];
        if (this.props) for(let t in this.props)e.push([
            +t,
            this.props[t]
        ]);
        return e;
    }
    balance(e = {}) {
        return this.children.length <= 8 ? this : Cc(et.none, this.children, this.positions, 0, this.children.length, 0, this.length, (t, n, r)=>new Te(this.type, t, n, r, this.propValues), e.makeTree || ((t, n, r)=>new Te(et.none, t, n, r)));
    }
    static build(e) {
        return nb(e);
    }
}
Te.empty = new Te(et.none, [], [], 0);
class kc {
    constructor(e, t){
        this.buffer = e, this.index = t;
    }
    get id() {
        return this.buffer[this.index - 4];
    }
    get start() {
        return this.buffer[this.index - 3];
    }
    get end() {
        return this.buffer[this.index - 2];
    }
    get size() {
        return this.buffer[this.index - 1];
    }
    get pos() {
        return this.index;
    }
    next() {
        this.index -= 4;
    }
    fork() {
        return new kc(this.buffer, this.index);
    }
}
class Qi {
    constructor(e, t, n){
        this.buffer = e, this.length = t, this.set = n;
    }
    get type() {
        return et.none;
    }
    toString() {
        let e = [];
        for(let t = 0; t < this.buffer.length;)e.push(this.childString(t)), t = this.buffer[t + 3];
        return e.join(",");
    }
    childString(e) {
        let t = this.buffer[e], n = this.buffer[e + 3], r = this.set.types[t], s = r.name;
        if (/\W/.test(s) && !r.isError && (s = JSON.stringify(s)), e += 4, n == e) return s;
        let o = [];
        for(; e < n;)o.push(this.childString(e)), e = this.buffer[e + 3];
        return s + "(" + o.join(",") + ")";
    }
    findChild(e, t, n, r, s) {
        let { buffer: o } = this, l = -1;
        for(let a = e; a != t && !(qp(s, r, o[a + 1], o[a + 2]) && (l = a, n > 0)); a = o[a + 3]);
        return l;
    }
    slice(e, t, n) {
        let r = this.buffer, s = new Uint16Array(t - e), o = 0;
        for(let l = e, a = 0; l < t;){
            s[a++] = r[l++], s[a++] = r[l++] - n;
            let c = s[a++] = r[l++] - n;
            s[a++] = r[l++] - e, o = Math.max(o, c);
        }
        return new Qi(s, o, this.set);
    }
}
function qp(i, e, t, n) {
    switch(i){
        case -2:
            return t < e;
        case -1:
            return n >= e && t < e;
        case 0:
            return t < e && n > e;
        case 1:
            return t <= e && n > e;
        case 2:
            return n > e;
        case 4:
            return !0;
    }
}
function vr(i, e, t, n) {
    for(var r; i.from == i.to || (t < 1 ? i.from >= e : i.from > e) || (t > -1 ? i.to <= e : i.to < e);){
        let o = !n && i instanceof ft && i.index < 0 ? null : i.parent;
        if (!o) return i;
        i = o;
    }
    let s = n ? 0 : Ae.IgnoreOverlays;
    if (n) for(let o = i, l = o.parent; l; o = l, l = o.parent)o instanceof ft && o.index < 0 && ((r = l.enter(e, t, s)) === null || r === void 0 ? void 0 : r.from) != o.from && (i = l);
    for(;;){
        let o = i.enter(e, t, s);
        if (!o) return i;
        i = o;
    }
}
class jp {
    cursor(e = 0) {
        return new Jl(this, e);
    }
    getChild(e, t = null, n = null) {
        let r = Qh(this, e, t, n);
        return r.length ? r[0] : null;
    }
    getChildren(e, t = null, n = null) {
        return Qh(this, e, t, n);
    }
    resolve(e, t = 0) {
        return vr(this, e, t, !1);
    }
    resolveInner(e, t = 0) {
        return vr(this, e, t, !0);
    }
    matchContext(e) {
        return Gl(this, e);
    }
    enterUnfinishedNodesBefore(e) {
        let t = this.childBefore(e), n = this;
        for(; t;){
            let r = t.lastChild;
            if (!r || r.to != t.to) break;
            r.type.isError && r.from == r.to ? (n = t, t = r.prevSibling) : t = r;
        }
        return n;
    }
    get node() {
        return this;
    }
    get next() {
        return this.parent;
    }
}
class ft extends jp {
    constructor(e, t, n, r){
        super(), this._tree = e, this.from = t, this.index = n, this._parent = r;
    }
    get type() {
        return this._tree.type;
    }
    get name() {
        return this._tree.type.name;
    }
    get to() {
        return this.from + this._tree.length;
    }
    nextChild(e, t, n, r, s = 0) {
        for(let o = this;;){
            for(let { children: l, positions: a } = o._tree, c = t > 0 ? l.length : -1; e != c; e += t){
                let h = l[e], u = a[e] + o.from;
                if (qp(r, n, u, u + h.length)) {
                    if (h instanceof Qi) {
                        if (s & Ae.ExcludeBuffers) continue;
                        let f = h.findChild(0, h.buffer.length, t, n - u, r);
                        if (f > -1) return new yi(new eb(o, h, e, u), null, f);
                    } else if (s & Ae.IncludeAnonymous || !h.type.isAnonymous || Sc(h)) {
                        let f;
                        if (!(s & Ae.IgnoreMounts) && (f = Us.get(h)) && !f.overlay) return new ft(f.tree, u, e, o);
                        let d = new ft(h, u, e, o);
                        return s & Ae.IncludeAnonymous || !d.type.isAnonymous ? d : d.nextChild(t < 0 ? h.children.length - 1 : 0, t, n, r);
                    }
                }
            }
            if (s & Ae.IncludeAnonymous || !o.type.isAnonymous || (o.index >= 0 ? e = o.index + t : e = t < 0 ? -1 : o._parent._tree.children.length, o = o._parent, !o)) return null;
        }
    }
    get firstChild() {
        return this.nextChild(0, 1, 0, 4);
    }
    get lastChild() {
        return this.nextChild(this._tree.children.length - 1, -1, 0, 4);
    }
    childAfter(e) {
        return this.nextChild(0, 1, e, 2);
    }
    childBefore(e) {
        return this.nextChild(this._tree.children.length - 1, -1, e, -2);
    }
    enter(e, t, n = 0) {
        let r;
        if (!(n & Ae.IgnoreOverlays) && (r = Us.get(this._tree)) && r.overlay) {
            let s = e - this.from;
            for (let { from: o, to: l } of r.overlay)if ((t > 0 ? o <= s : o < s) && (t < 0 ? l >= s : l > s)) return new ft(r.tree, r.overlay[0].from + this.from, -1, this);
        }
        return this.nextChild(0, 1, e, t, n);
    }
    nextSignificantParent() {
        let e = this;
        for(; e.type.isAnonymous && e._parent;)e = e._parent;
        return e;
    }
    get parent() {
        return this._parent ? this._parent.nextSignificantParent() : null;
    }
    get nextSibling() {
        return this._parent && this.index >= 0 ? this._parent.nextChild(this.index + 1, 1, 0, 4) : null;
    }
    get prevSibling() {
        return this._parent && this.index >= 0 ? this._parent.nextChild(this.index - 1, -1, 0, 4) : null;
    }
    get tree() {
        return this._tree;
    }
    toTree() {
        return this._tree;
    }
    toString() {
        return this._tree.toString();
    }
}
function Qh(i, e, t, n) {
    let r = i.cursor(), s = [];
    if (!r.firstChild()) return s;
    if (t != null) {
        for(; !r.type.is(t);)if (!r.nextSibling()) return s;
    }
    for(;;){
        if (n != null && r.type.is(n)) return s;
        if (r.type.is(e) && s.push(r.node), !r.nextSibling()) return n == null ? s : [];
    }
}
function Gl(i, e, t = e.length - 1) {
    for(let n = i.parent; t >= 0; n = n.parent){
        if (!n) return !1;
        if (!n.type.isAnonymous) {
            if (e[t] && e[t] != n.name) return !1;
            t--;
        }
    }
    return !0;
}
class eb {
    constructor(e, t, n, r){
        this.parent = e, this.buffer = t, this.index = n, this.start = r;
    }
}
class yi extends jp {
    get name() {
        return this.type.name;
    }
    get from() {
        return this.context.start + this.context.buffer.buffer[this.index + 1];
    }
    get to() {
        return this.context.start + this.context.buffer.buffer[this.index + 2];
    }
    constructor(e, t, n){
        super(), this.context = e, this._parent = t, this.index = n, this.type = e.buffer.set.types[e.buffer.buffer[n]];
    }
    child(e, t, n) {
        let { buffer: r } = this.context, s = r.findChild(this.index + 4, r.buffer[this.index + 3], e, t - this.context.start, n);
        return s < 0 ? null : new yi(this.context, this, s);
    }
    get firstChild() {
        return this.child(1, 0, 4);
    }
    get lastChild() {
        return this.child(-1, 0, 4);
    }
    childAfter(e) {
        return this.child(1, e, 2);
    }
    childBefore(e) {
        return this.child(-1, e, -2);
    }
    enter(e, t, n = 0) {
        if (n & Ae.ExcludeBuffers) return null;
        let { buffer: r } = this.context, s = r.findChild(this.index + 4, r.buffer[this.index + 3], t > 0 ? 1 : -1, e - this.context.start, t);
        return s < 0 ? null : new yi(this.context, this, s);
    }
    get parent() {
        return this._parent || this.context.parent.nextSignificantParent();
    }
    externalSibling(e) {
        return this._parent ? null : this.context.parent.nextChild(this.context.index + e, e, 0, 4);
    }
    get nextSibling() {
        let { buffer: e } = this.context, t = e.buffer[this.index + 3];
        return t < (this._parent ? e.buffer[this._parent.index + 3] : e.buffer.length) ? new yi(this.context, this._parent, t) : this.externalSibling(1);
    }
    get prevSibling() {
        let { buffer: e } = this.context, t = this._parent ? this._parent.index + 4 : 0;
        return this.index == t ? this.externalSibling(-1) : new yi(this.context, this._parent, e.findChild(t, this.index, -1, 0, 4));
    }
    get tree() {
        return null;
    }
    toTree() {
        let e = [], t = [], { buffer: n } = this.context, r = this.index + 4, s = n.buffer[this.index + 3];
        if (s > r) {
            let o = n.buffer[this.index + 1];
            e.push(n.slice(r, s, o)), t.push(0);
        }
        return new Te(this.type, e, t, this.to - this.from);
    }
    toString() {
        return this.context.buffer.childString(this.index);
    }
}
function Fp(i) {
    if (!i.length) return null;
    if (i.length == 1) return i[0];
    let e = 0, t = i[0];
    for(let s = 1; s < i.length; s++){
        let o = i[s];
        (o.from > t.from || o.to < t.to) && (t = o, e = s);
    }
    let n = t instanceof ft && t.index < 0 ? null : t.parent, r = i.slice();
    return n ? r[e] = n : r.splice(e, 1), new tb(r, t);
}
class tb {
    constructor(e, t){
        this.heads = e, this.node = t;
    }
    get next() {
        return Fp(this.heads);
    }
}
function ib(i, e, t) {
    let n = i.resolveInner(e, t), r = null;
    for(let s = n instanceof ft ? n : n.context.parent; s; s = s.parent)if (s.index < 0) {
        let o = s.parent;
        (r || (r = [
            n
        ])).push(o.resolve(e, t)), s = o;
    } else {
        let o = Us.get(s.tree);
        if (o && o.overlay && o.overlay[0].from <= e && o.overlay[o.overlay.length - 1].to >= e) {
            let l = new ft(o.tree, o.overlay[0].from + s.from, 0, null);
            (r || (r = [
                n
            ])).push(vr(l, e, t, !1));
        }
    }
    return r ? Fp(r) : n;
}
class Jl {
    get name() {
        return this.type.name;
    }
    constructor(e, t = 0){
        if (this.mode = t, this.buffer = null, this.stack = [], this.index = 0, this.bufferNode = null, e instanceof ft) this.yieldNode(e);
        else {
            this._tree = e.context.parent, this.buffer = e.context;
            for(let n = e._parent; n; n = n._parent)this.stack.unshift(n.index);
            this.bufferNode = e, this.yieldBuf(e.index);
        }
    }
    yieldNode(e) {
        return e ? (this._tree = e, this.type = e.type, this.from = e.from, this.to = e.to, !0) : !1;
    }
    yieldBuf(e, t) {
        this.index = e;
        let { start: n, buffer: r } = this.buffer;
        return this.type = t || r.set.types[r.buffer[e]], this.from = n + r.buffer[e + 1], this.to = n + r.buffer[e + 2], !0;
    }
    yield(e) {
        return e ? e instanceof ft ? (this.buffer = null, this.yieldNode(e)) : (this.buffer = e.context, this.yieldBuf(e.index, e.type)) : !1;
    }
    toString() {
        return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
    }
    enterChild(e, t, n) {
        if (!this.buffer) return this.yield(this._tree.nextChild(e < 0 ? this._tree._tree.children.length - 1 : 0, e, t, n, this.mode));
        let { buffer: r } = this.buffer, s = r.findChild(this.index + 4, r.buffer[this.index + 3], e, t - this.buffer.start, n);
        return s < 0 ? !1 : (this.stack.push(this.index), this.yieldBuf(s));
    }
    firstChild() {
        return this.enterChild(1, 0, 4);
    }
    lastChild() {
        return this.enterChild(-1, 0, 4);
    }
    childAfter(e) {
        return this.enterChild(1, e, 2);
    }
    childBefore(e) {
        return this.enterChild(-1, e, -2);
    }
    enter(e, t, n = this.mode) {
        return this.buffer ? n & Ae.ExcludeBuffers ? !1 : this.enterChild(1, e, t) : this.yield(this._tree.enter(e, t, n));
    }
    parent() {
        if (!this.buffer) return this.yieldNode(this.mode & Ae.IncludeAnonymous ? this._tree._parent : this._tree.parent);
        if (this.stack.length) return this.yieldBuf(this.stack.pop());
        let e = this.mode & Ae.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
        return this.buffer = null, this.yieldNode(e);
    }
    sibling(e) {
        if (!this.buffer) return this._tree._parent ? this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + e, e, 0, 4, this.mode)) : !1;
        let { buffer: t } = this.buffer, n = this.stack.length - 1;
        if (e < 0) {
            let r = n < 0 ? 0 : this.stack[n] + 4;
            if (this.index != r) return this.yieldBuf(t.findChild(r, this.index, -1, 0, 4));
        } else {
            let r = t.buffer[this.index + 3];
            if (r < (n < 0 ? t.buffer.length : t.buffer[this.stack[n] + 3])) return this.yieldBuf(r);
        }
        return n < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + e, e, 0, 4, this.mode)) : !1;
    }
    nextSibling() {
        return this.sibling(1);
    }
    prevSibling() {
        return this.sibling(-1);
    }
    atLastNode(e) {
        let t, n, { buffer: r } = this;
        if (r) {
            if (e > 0) {
                if (this.index < r.buffer.buffer.length) return !1;
            } else for(let s = 0; s < this.index; s++)if (r.buffer.buffer[s + 3] < this.index) return !1;
            ({ index: t, parent: n } = r);
        } else ({ index: t, _parent: n } = this._tree);
        for(; n; { index: t, _parent: n } = n)if (t > -1) for(let s = t + e, o = e < 0 ? -1 : n._tree.children.length; s != o; s += e){
            let l = n._tree.children[s];
            if (this.mode & Ae.IncludeAnonymous || l instanceof Qi || !l.type.isAnonymous || Sc(l)) return !1;
        }
        return !0;
    }
    move(e, t) {
        if (t && this.enterChild(e, 0, 4)) return !0;
        for(;;){
            if (this.sibling(e)) return !0;
            if (this.atLastNode(e) || !this.parent()) return !1;
        }
    }
    next(e = !0) {
        return this.move(1, e);
    }
    prev(e = !0) {
        return this.move(-1, e);
    }
    moveTo(e, t = 0) {
        for(; (this.from == this.to || (t < 1 ? this.from >= e : this.from > e) || (t > -1 ? this.to <= e : this.to < e)) && this.parent(););
        for(; this.enterChild(1, e, t););
        return this;
    }
    get node() {
        if (!this.buffer) return this._tree;
        let e = this.bufferNode, t = null, n = 0;
        if (e && e.context == this.buffer) e: for(let r = this.index, s = this.stack.length; s >= 0;){
            for(let o = e; o; o = o._parent)if (o.index == r) {
                if (r == this.index) return o;
                t = o, n = s + 1;
                break e;
            }
            r = this.stack[--s];
        }
        for(let r = n; r < this.stack.length; r++)t = new yi(this.buffer, t, this.stack[r]);
        return this.bufferNode = new yi(this.buffer, t, this.index);
    }
    get tree() {
        return this.buffer ? null : this._tree._tree;
    }
    iterate(e, t) {
        for(let n = 0;;){
            let r = !1;
            if (this.type.isAnonymous || e(this) !== !1) {
                if (this.firstChild()) {
                    n++;
                    continue;
                }
                this.type.isAnonymous || (r = !0);
            }
            for(; r && t && t(this), r = this.type.isAnonymous, !this.nextSibling();){
                if (!n) return;
                this.parent(), n--, r = !0;
            }
        }
    }
    matchContext(e) {
        if (!this.buffer) return Gl(this.node, e);
        let { buffer: t } = this.buffer, { types: n } = t.set;
        for(let r = e.length - 1, s = this.stack.length - 1; r >= 0; s--){
            if (s < 0) return Gl(this.node, e, r);
            let o = n[t.buffer[this.stack[s]]];
            if (!o.isAnonymous) {
                if (e[r] && e[r] != o.name) return !1;
                r--;
            }
        }
        return !0;
    }
}
function Sc(i) {
    return i.children.some((e)=>e instanceof Qi || !e.type.isAnonymous || Sc(e));
}
function nb(i) {
    var e;
    let { buffer: t, nodeSet: n, maxBufferLength: r = Ip, reused: s = [], minRepeatType: o = n.types.length } = i, l = Array.isArray(t) ? new kc(t, t.length) : t, a = n.types, c = 0, h = 0;
    function u(S, x, R, E, K) {
        let { id: W, start: U, end: G, size: L } = l, v = h;
        for(; L < 0;)if (l.next(), L == -1) {
            let xe = s[W];
            R.push(xe), E.push(U - S);
            return;
        } else if (L == -3) {
            c = W;
            return;
        } else if (L == -4) {
            h = W;
            return;
        } else throw new RangeError(`Unrecognized record size: ${L}`);
        let N = a[W], B, _, V = U - S;
        if (G - U <= r && (_ = y(l.pos - x, K))) {
            let xe = new Uint16Array(_.size - _.skip), ae = l.pos - _.size, de = xe.length;
            for(; l.pos > ae;)de = b(_.start, xe, de);
            B = new Qi(xe, G - _.start, n), V = _.start - S;
        } else {
            let xe = l.pos - L;
            l.next();
            let ae = [], de = [], qe = W >= o ? W : -1, $e = 0, ot = G;
            for(; l.pos > xe;)qe >= 0 && l.id == qe && l.size >= 0 ? (l.end <= ot - r && (d(ae, de, U, $e, l.end, ot, qe, v), $e = ae.length, ot = l.end), l.next()) : u(U, xe, ae, de, qe);
            if (qe >= 0 && $e > 0 && $e < ae.length && d(ae, de, U, $e, U, ot, qe, v), ae.reverse(), de.reverse(), qe > -1 && $e > 0) {
                let mt = f(N);
                B = Cc(N, ae, de, 0, ae.length, 0, G - U, mt, mt);
            } else B = p(N, ae, de, G - U, v - G);
        }
        R.push(B), E.push(V);
    }
    function f(S) {
        return (x, R, E)=>{
            let K = 0, W = x.length - 1, U, G;
            if (W >= 0 && (U = x[W]) instanceof Te) {
                if (!W && U.type == S && U.length == E) return U;
                (G = U.prop(Q.lookAhead)) && (K = R[W] + U.length + G);
            }
            return p(S, x, R, E, K);
        };
    }
    function d(S, x, R, E, K, W, U, G) {
        let L = [], v = [];
        for(; S.length > E;)L.push(S.pop()), v.push(x.pop() + R - K);
        S.push(p(n.types[U], L, v, W - K, G - W)), x.push(K - R);
    }
    function p(S, x, R, E, K = 0, W) {
        if (c) {
            let U = [
                Q.contextHash,
                c
            ];
            W = W ? [
                U
            ].concat(W) : [
                U
            ];
        }
        if (K > 25) {
            let U = [
                Q.lookAhead,
                K
            ];
            W = W ? [
                U
            ].concat(W) : [
                U
            ];
        }
        return new Te(S, x, R, E, W);
    }
    function y(S, x) {
        let R = l.fork(), E = 0, K = 0, W = 0, U = R.end - r, G = {
            size: 0,
            start: 0,
            skip: 0
        };
        e: for(let L = R.pos - S; R.pos > L;){
            let v = R.size;
            if (R.id == x && v >= 0) {
                G.size = E, G.start = K, G.skip = W, W += 4, E += 4, R.next();
                continue;
            }
            let N = R.pos - v;
            if (v < 0 || N < L || R.start < U) break;
            let B = R.id >= o ? 4 : 0, _ = R.start;
            for(R.next(); R.pos > N;){
                if (R.size < 0) {
                    if (R.size == -3) B += 4;
                    else break e;
                } else R.id >= o && (B += 4);
                R.next();
            }
            K = _, E += v, W += B;
        }
        return (x < 0 || E == S) && (G.size = E, G.start = K, G.skip = W), G.size > 4 ? G : void 0;
    }
    function b(S, x, R) {
        let { id: E, start: K, end: W, size: U } = l;
        if (l.next(), U >= 0 && E < o) {
            let G = R;
            if (U > 4) {
                let L = l.pos - (U - 4);
                for(; l.pos > L;)R = b(S, x, R);
            }
            x[--R] = G, x[--R] = W - S, x[--R] = K - S, x[--R] = E;
        } else U == -3 ? c = E : U == -4 && (h = E);
        return R;
    }
    let k = [], T = [];
    for(; l.pos > 0;)u(i.start || 0, i.bufferStart || 0, k, T, -1);
    let D = (e = i.length) !== null && e !== void 0 ? e : k.length ? T[0] + k[0].length : 0;
    return new Te(a[i.topID], k.reverse(), T.reverse(), D);
}
const Yh = new WeakMap;
function Ns(i, e) {
    if (!i.isAnonymous || e instanceof Qi || e.type != i) return 1;
    let t = Yh.get(e);
    if (t == null) {
        t = 1;
        for (let n of e.children){
            if (n.type != i || !(n instanceof Te)) {
                t = 1;
                break;
            }
            t += Ns(i, n);
        }
        Yh.set(e, t);
    }
    return t;
}
function Cc(i, e, t, n, r, s, o, l, a) {
    let c = 0;
    for(let p = n; p < r; p++)c += Ns(i, e[p]);
    let h = Math.ceil(c * 1.5 / 8), u = [], f = [];
    function d(p, y, b, k, T) {
        for(let D = b; D < k;){
            let S = D, x = y[D], R = Ns(i, p[D]);
            for(D++; D < k; D++){
                let E = Ns(i, p[D]);
                if (R + E >= h) break;
                R += E;
            }
            if (D == S + 1) {
                if (R > h) {
                    let E = p[S];
                    d(E.children, E.positions, 0, E.children.length, y[S] + T);
                    continue;
                }
                u.push(p[S]);
            } else {
                let E = y[D - 1] + p[D - 1].length - x;
                u.push(Cc(i, p, y, S, D, x, E, null, a));
            }
            f.push(x + T - s);
        }
    }
    return d(e, t, n, r, 0), (l || a)(u, f, o);
}
class Wi {
    constructor(e, t, n, r, s = !1, o = !1){
        this.from = e, this.to = t, this.tree = n, this.offset = r, this.open = (s ? 1 : 0) | (o ? 2 : 0);
    }
    get openStart() {
        return (this.open & 1) > 0;
    }
    get openEnd() {
        return (this.open & 2) > 0;
    }
    static addTree(e, t = [], n = !1) {
        let r = [
            new Wi(0, e.length, e, 0, !1, n)
        ];
        for (let s of t)s.to > e.length && r.push(s);
        return r;
    }
    static applyChanges(e, t, n = 128) {
        if (!t.length) return e;
        let r = [], s = 1, o = e.length ? e[0] : null;
        for(let l = 0, a = 0, c = 0;; l++){
            let h = l < t.length ? t[l] : null, u = h ? h.fromA : 1e9;
            if (u - a >= n) for(; o && o.from < u;){
                let f = o;
                if (a >= f.from || u <= f.to || c) {
                    let d = Math.max(f.from, a) - c, p = Math.min(f.to, u) - c;
                    f = d >= p ? null : new Wi(d, p, f.tree, f.offset + c, l > 0, !!h);
                }
                if (f && r.push(f), o.to > u) break;
                o = s < e.length ? e[s++] : null;
            }
            if (!h) break;
            a = h.toA, c = h.toA - h.toB;
        }
        return r;
    }
}
class Hp {
    startParse(e, t, n) {
        return typeof e == "string" && (e = new rb(e)), n = n ? n.length ? n.map((r)=>new Zo(r.from, r.to)) : [
            new Zo(0, 0)
        ] : [
            new Zo(0, e.length)
        ], this.createParse(e, t || [], n);
    }
    parse(e, t, n) {
        let r = this.startParse(e, t, n);
        for(;;){
            let s = r.advance();
            if (s) return s;
        }
    }
}
class rb {
    constructor(e){
        this.string = e;
    }
    get length() {
        return this.string.length;
    }
    chunk(e) {
        return this.string.slice(e);
    }
    get lineChunks() {
        return !1;
    }
    read(e, t) {
        return this.string.slice(e, t);
    }
}
new Q({
    perNode: !0
});
let sb = 0;
class Lt {
    constructor(e, t, n){
        this.set = e, this.base = t, this.modified = n, this.id = sb++;
    }
    static define(e) {
        if (e != null && e.base) throw new Error("Can not derive from a modified tag");
        let t = new Lt([], null, []);
        if (t.set.push(t), e) for (let n of e.set)t.set.push(n);
        return t;
    }
    static defineModifier() {
        let e = new Ks;
        return (t)=>t.modified.indexOf(e) > -1 ? t : Ks.get(t.base || t, t.modified.concat(e).sort((n, r)=>n.id - r.id));
    }
}
let ob = 0;
class Ks {
    constructor(){
        this.instances = [], this.id = ob++;
    }
    static get(e, t) {
        if (!t.length) return e;
        let n = t[0].instances.find((l)=>l.base == e && lb(t, l.modified));
        if (n) return n;
        let r = [], s = new Lt(r, e, t);
        for (let l of t)l.instances.push(s);
        let o = ab(t);
        for (let l of e.set)if (!l.modified.length) for (let a of o)r.push(Ks.get(l, a));
        return s;
    }
}
function lb(i, e) {
    return i.length == e.length && i.every((t, n)=>t == e[n]);
}
function ab(i) {
    let e = [
        []
    ];
    for(let t = 0; t < i.length; t++)for(let n = 0, r = e.length; n < r; n++)e.push(e[n].concat(i[t]));
    return e.sort((t, n)=>n.length - t.length);
}
function Wp(i) {
    let e = Object.create(null);
    for(let t in i){
        let n = i[t];
        Array.isArray(n) || (n = [
            n
        ]);
        for (let r of t.split(" "))if (r) {
            let s = [], o = 2, l = r;
            for(let u = 0;;){
                if (l == "..." && u > 0 && u + 3 == r.length) {
                    o = 1;
                    break;
                }
                let f = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(l);
                if (!f) throw new RangeError("Invalid path: " + r);
                if (s.push(f[0] == "*" ? "" : f[0][0] == '"' ? JSON.parse(f[0]) : f[0]), u += f[0].length, u == r.length) break;
                let d = r[u++];
                if (u == r.length && d == "!") {
                    o = 0;
                    break;
                }
                if (d != "/") throw new RangeError("Invalid path: " + r);
                l = r.slice(u);
            }
            let a = s.length - 1, c = s[a];
            if (!c) throw new RangeError("Invalid path: " + r);
            let h = new Gs(n, o, a > 0 ? s.slice(0, a) : null);
            e[c] = h.sort(e[c]);
        }
    }
    return Vp.add(e);
}
const Vp = new Q;
class Gs {
    constructor(e, t, n, r){
        this.tags = e, this.mode = t, this.context = n, this.next = r;
    }
    get opaque() {
        return this.mode == 0;
    }
    get inherit() {
        return this.mode == 1;
    }
    sort(e) {
        return !e || e.depth < this.depth ? (this.next = e, this) : (e.next = this.sort(e.next), e);
    }
    get depth() {
        return this.context ? this.context.length : 0;
    }
}
Gs.empty = new Gs([], 2, null);
function $p(i, e) {
    let t = Object.create(null);
    for (let s of i)if (!Array.isArray(s.tag)) t[s.tag.id] = s.class;
    else for (let o of s.tag)t[o.id] = s.class;
    let { scope: n, all: r = null } = e || {};
    return {
        style: (s)=>{
            let o = r;
            for (let l of s)for (let a of l.set){
                let c = t[a.id];
                if (c) {
                    o = o ? o + " " + c : c;
                    break;
                }
            }
            return o;
        },
        scope: n
    };
}
function cb(i, e) {
    let t = null;
    for (let n of i){
        let r = n.style(e);
        r && (t = t ? t + " " + r : r);
    }
    return t;
}
function hb(i, e, t, n = 0, r = i.length) {
    let s = new ub(n, Array.isArray(e) ? e : [
        e
    ], t);
    s.highlightRange(i.cursor(), n, r, "", s.highlighters), s.flush(r);
}
class ub {
    constructor(e, t, n){
        this.at = e, this.highlighters = t, this.span = n, this.class = "";
    }
    startSpan(e, t) {
        t != this.class && (this.flush(e), e > this.at && (this.at = e), this.class = t);
    }
    flush(e) {
        e > this.at && this.class && this.span(this.at, e, this.class);
    }
    highlightRange(e, t, n, r, s) {
        let { type: o, from: l, to: a } = e;
        if (l >= n || a <= t) return;
        o.isTop && (s = this.highlighters.filter((d)=>!d.scope || d.scope(o)));
        let c = r, h = fb(e) || Gs.empty, u = cb(s, h.tags);
        if (u && (c && (c += " "), c += u, h.mode == 1 && (r += (r ? " " : "") + u)), this.startSpan(Math.max(t, l), c), h.opaque) return;
        let f = e.tree && e.tree.prop(Q.mounted);
        if (f && f.overlay) {
            let d = e.node.enter(f.overlay[0].from + l, 1), p = this.highlighters.filter((b)=>!b.scope || b.scope(f.tree.type)), y = e.firstChild();
            for(let b = 0, k = l;; b++){
                let T = b < f.overlay.length ? f.overlay[b] : null, D = T ? T.from + l : a, S = Math.max(t, k), x = Math.min(n, D);
                if (S < x && y) for(; e.from < x && (this.highlightRange(e, S, x, r, s), this.startSpan(Math.min(x, e.to), c), !(e.to >= D || !e.nextSibling())););
                if (!T || D > n) break;
                k = T.to + l, k > t && (this.highlightRange(d.cursor(), Math.max(t, T.from + l), Math.min(n, k), "", p), this.startSpan(Math.min(n, k), c));
            }
            y && e.parent();
        } else if (e.firstChild()) {
            f && (r = "");
            do if (!(e.to <= t)) {
                if (e.from >= n) break;
                this.highlightRange(e, t, n, r, s), this.startSpan(Math.min(n, e.to), c);
            }
            while (e.nextSibling());
            e.parent();
        }
    }
}
function fb(i) {
    let e = i.type.prop(Vp);
    for(; e && e.context && !i.matchContext(e.context);)e = e.next;
    return e || null;
}
const A = Lt.define, ys = A(), hi = A(), Xh = A(hi), Zh = A(hi), ui = A(), bs = A(ui), el = A(ui), Nt = A(), Li = A(Nt), _t = A(), Et = A(), Ql = A(), Xn = A(Ql), vs = A(), P = {
    comment: ys,
    lineComment: A(ys),
    blockComment: A(ys),
    docComment: A(ys),
    name: hi,
    variableName: A(hi),
    typeName: Xh,
    tagName: A(Xh),
    propertyName: Zh,
    attributeName: A(Zh),
    className: A(hi),
    labelName: A(hi),
    namespace: A(hi),
    macroName: A(hi),
    literal: ui,
    string: bs,
    docString: A(bs),
    character: A(bs),
    attributeValue: A(bs),
    number: el,
    integer: A(el),
    float: A(el),
    bool: A(ui),
    regexp: A(ui),
    escape: A(ui),
    color: A(ui),
    url: A(ui),
    keyword: _t,
    self: A(_t),
    null: A(_t),
    atom: A(_t),
    unit: A(_t),
    modifier: A(_t),
    operatorKeyword: A(_t),
    controlKeyword: A(_t),
    definitionKeyword: A(_t),
    moduleKeyword: A(_t),
    operator: Et,
    derefOperator: A(Et),
    arithmeticOperator: A(Et),
    logicOperator: A(Et),
    bitwiseOperator: A(Et),
    compareOperator: A(Et),
    updateOperator: A(Et),
    definitionOperator: A(Et),
    typeOperator: A(Et),
    controlOperator: A(Et),
    punctuation: Ql,
    separator: A(Ql),
    bracket: Xn,
    angleBracket: A(Xn),
    squareBracket: A(Xn),
    paren: A(Xn),
    brace: A(Xn),
    content: Nt,
    heading: Li,
    heading1: A(Li),
    heading2: A(Li),
    heading3: A(Li),
    heading4: A(Li),
    heading5: A(Li),
    heading6: A(Li),
    contentSeparator: A(Nt),
    list: A(Nt),
    quote: A(Nt),
    emphasis: A(Nt),
    strong: A(Nt),
    link: A(Nt),
    monospace: A(Nt),
    strikethrough: A(Nt),
    inserted: A(),
    deleted: A(),
    changed: A(),
    invalid: A(),
    meta: vs,
    documentMeta: A(vs),
    annotation: A(vs),
    processingInstruction: A(vs),
    definition: Lt.defineModifier(),
    constant: Lt.defineModifier(),
    function: Lt.defineModifier(),
    standard: Lt.defineModifier(),
    local: Lt.defineModifier(),
    special: Lt.defineModifier()
};
$p([
    {
        tag: P.link,
        class: "tok-link"
    },
    {
        tag: P.heading,
        class: "tok-heading"
    },
    {
        tag: P.emphasis,
        class: "tok-emphasis"
    },
    {
        tag: P.strong,
        class: "tok-strong"
    },
    {
        tag: P.keyword,
        class: "tok-keyword"
    },
    {
        tag: P.atom,
        class: "tok-atom"
    },
    {
        tag: P.bool,
        class: "tok-bool"
    },
    {
        tag: P.url,
        class: "tok-url"
    },
    {
        tag: P.labelName,
        class: "tok-labelName"
    },
    {
        tag: P.inserted,
        class: "tok-inserted"
    },
    {
        tag: P.deleted,
        class: "tok-deleted"
    },
    {
        tag: P.literal,
        class: "tok-literal"
    },
    {
        tag: P.string,
        class: "tok-string"
    },
    {
        tag: P.number,
        class: "tok-number"
    },
    {
        tag: [
            P.regexp,
            P.escape,
            P.special(P.string)
        ],
        class: "tok-string2"
    },
    {
        tag: P.variableName,
        class: "tok-variableName"
    },
    {
        tag: P.local(P.variableName),
        class: "tok-variableName tok-local"
    },
    {
        tag: P.definition(P.variableName),
        class: "tok-variableName tok-definition"
    },
    {
        tag: P.special(P.variableName),
        class: "tok-variableName2"
    },
    {
        tag: P.definition(P.propertyName),
        class: "tok-propertyName tok-definition"
    },
    {
        tag: P.typeName,
        class: "tok-typeName"
    },
    {
        tag: P.namespace,
        class: "tok-namespace"
    },
    {
        tag: P.className,
        class: "tok-className"
    },
    {
        tag: P.macroName,
        class: "tok-macroName"
    },
    {
        tag: P.propertyName,
        class: "tok-propertyName"
    },
    {
        tag: P.operator,
        class: "tok-operator"
    },
    {
        tag: P.comment,
        class: "tok-comment"
    },
    {
        tag: P.meta,
        class: "tok-meta"
    },
    {
        tag: P.invalid,
        class: "tok-invalid"
    },
    {
        tag: P.punctuation,
        class: "tok-punctuation"
    }
]);
var tl;
const on = new Q;
function db(i) {
    return q.define({
        combine: i ? (e)=>e.concat(i) : void 0
    });
}
const pb = new Q;
class kt {
    constructor(e, t, n = [], r = ""){
        this.data = e, this.name = r, ie.prototype.hasOwnProperty("tree") || Object.defineProperty(ie.prototype, "tree", {
            get () {
                return tt(this);
            }
        }), this.parser = t, this.extension = [
            Di.of(this),
            ie.languageData.of((s, o, l)=>{
                let a = eu(s, o, l), c = a.type.prop(on);
                if (!c) return [];
                let h = s.facet(c), u = a.type.prop(pb);
                if (u) {
                    let f = a.resolve(o - a.from, l);
                    for (let d of u)if (d.test(f, s)) {
                        let p = s.facet(d.facet);
                        return d.type == "replace" ? p : p.concat(h);
                    }
                }
                return h;
            })
        ].concat(n);
    }
    isActiveAt(e, t, n = -1) {
        return eu(e, t, n).type.prop(on) == this.data;
    }
    findRegions(e) {
        let t = e.facet(Di);
        if ((t == null ? void 0 : t.data) == this.data) return [
            {
                from: 0,
                to: e.doc.length
            }
        ];
        if (!t || !t.allowsNesting) return [];
        let n = [], r = (s, o)=>{
            if (s.prop(on) == this.data) {
                n.push({
                    from: o,
                    to: o + s.length
                });
                return;
            }
            let l = s.prop(Q.mounted);
            if (l) {
                if (l.tree.prop(on) == this.data) {
                    if (l.overlay) for (let a of l.overlay)n.push({
                        from: a.from + o,
                        to: a.to + o
                    });
                    else n.push({
                        from: o,
                        to: o + s.length
                    });
                    return;
                } else if (l.overlay) {
                    let a = n.length;
                    if (r(l.tree, l.overlay[0].from + o), n.length > a) return;
                }
            }
            for(let a = 0; a < s.children.length; a++){
                let c = s.children[a];
                c instanceof Te && r(c, s.positions[a] + o);
            }
        };
        return r(tt(e), 0), n;
    }
    get allowsNesting() {
        return !0;
    }
}
kt.setState = Z.define();
function eu(i, e, t) {
    let n = i.facet(Di), r = tt(i).topNode;
    if (!n || n.allowsNesting) for(let s = r; s; s = s.enter(e, t, Ae.ExcludeBuffers))s.type.isTop && (r = s);
    return r;
}
class Js extends kt {
    constructor(e, t, n){
        super(e, t, [], n), this.parser = t;
    }
    static define(e) {
        let t = db(e.languageData);
        return new Js(t, e.parser.configure({
            props: [
                on.add((n)=>n.isTop ? t : void 0)
            ]
        }), e.name);
    }
    configure(e, t) {
        return new Js(this.data, this.parser.configure(e), t || this.name);
    }
    get allowsNesting() {
        return this.parser.hasWrappers();
    }
}
function tt(i) {
    let e = i.field(kt.state, !1);
    return e ? e.tree : Te.empty;
}
class gb {
    constructor(e){
        this.doc = e, this.cursorPos = 0, this.string = "", this.cursor = e.iter();
    }
    get length() {
        return this.doc.length;
    }
    syncTo(e) {
        return this.string = this.cursor.next(e - this.cursorPos).value, this.cursorPos = e + this.string.length, this.cursorPos - this.string.length;
    }
    chunk(e) {
        return this.syncTo(e), this.string;
    }
    get lineChunks() {
        return !0;
    }
    read(e, t) {
        let n = this.cursorPos - this.string.length;
        return e < n || t >= this.cursorPos ? this.doc.sliceString(e, t) : this.string.slice(e - n, t - n);
    }
}
let Zn = null;
class Qs {
    constructor(e, t, n = [], r, s, o, l, a){
        this.parser = e, this.state = t, this.fragments = n, this.tree = r, this.treeLen = s, this.viewport = o, this.skipped = l, this.scheduleOn = a, this.parse = null, this.tempSkipped = [];
    }
    static create(e, t, n) {
        return new Qs(e, t, [], Te.empty, 0, n, [], null);
    }
    startParse() {
        return this.parser.startParse(new gb(this.state.doc), this.fragments);
    }
    work(e, t) {
        return t != null && t >= this.state.doc.length && (t = void 0), this.tree != Te.empty && this.isDone(t ?? this.state.doc.length) ? (this.takeTree(), !0) : this.withContext(()=>{
            var n;
            if (typeof e == "number") {
                let r = Date.now() + e;
                e = ()=>Date.now() > r;
            }
            for(this.parse || (this.parse = this.startParse()), t != null && (this.parse.stoppedAt == null || this.parse.stoppedAt > t) && t < this.state.doc.length && this.parse.stopAt(t);;){
                let r = this.parse.advance();
                if (r) {
                    if (this.fragments = this.withoutTempSkipped(Wi.addTree(r, this.fragments, this.parse.stoppedAt != null)), this.treeLen = (n = this.parse.stoppedAt) !== null && n !== void 0 ? n : this.state.doc.length, this.tree = r, this.parse = null, this.treeLen < (t ?? this.state.doc.length)) this.parse = this.startParse();
                    else return !0;
                }
                if (e()) return !1;
            }
        });
    }
    takeTree() {
        let e, t;
        this.parse && (e = this.parse.parsedPos) >= this.treeLen && ((this.parse.stoppedAt == null || this.parse.stoppedAt > e) && this.parse.stopAt(e), this.withContext(()=>{
            for(; !(t = this.parse.advance()););
        }), this.treeLen = e, this.tree = t, this.fragments = this.withoutTempSkipped(Wi.addTree(this.tree, this.fragments, !0)), this.parse = null);
    }
    withContext(e) {
        let t = Zn;
        Zn = this;
        try {
            return e();
        } finally{
            Zn = t;
        }
    }
    withoutTempSkipped(e) {
        for(let t; t = this.tempSkipped.pop();)e = tu(e, t.from, t.to);
        return e;
    }
    changes(e, t) {
        let { fragments: n, tree: r, treeLen: s, viewport: o, skipped: l } = this;
        if (this.takeTree(), !e.empty) {
            let a = [];
            if (e.iterChangedRanges((c, h, u, f)=>a.push({
                    fromA: c,
                    toA: h,
                    fromB: u,
                    toB: f
                })), n = Wi.applyChanges(n, a), r = Te.empty, s = 0, o = {
                from: e.mapPos(o.from, -1),
                to: e.mapPos(o.to, 1)
            }, this.skipped.length) {
                l = [];
                for (let c of this.skipped){
                    let h = e.mapPos(c.from, 1), u = e.mapPos(c.to, -1);
                    h < u && l.push({
                        from: h,
                        to: u
                    });
                }
            }
        }
        return new Qs(this.parser, t, n, r, s, o, l, this.scheduleOn);
    }
    updateViewport(e) {
        if (this.viewport.from == e.from && this.viewport.to == e.to) return !1;
        this.viewport = e;
        let t = this.skipped.length;
        for(let n = 0; n < this.skipped.length; n++){
            let { from: r, to: s } = this.skipped[n];
            r < e.to && s > e.from && (this.fragments = tu(this.fragments, r, s), this.skipped.splice(n--, 1));
        }
        return this.skipped.length >= t ? !1 : (this.reset(), !0);
    }
    reset() {
        this.parse && (this.takeTree(), this.parse = null);
    }
    skipUntilInView(e, t) {
        this.skipped.push({
            from: e,
            to: t
        });
    }
    static getSkippingParser(e) {
        return new class extends Hp {
            createParse(t, n, r) {
                let s = r[0].from, o = r[r.length - 1].to;
                return {
                    parsedPos: s,
                    advance () {
                        let a = Zn;
                        if (a) {
                            for (let c of r)a.tempSkipped.push(c);
                            e && (a.scheduleOn = a.scheduleOn ? Promise.all([
                                a.scheduleOn,
                                e
                            ]) : e);
                        }
                        return this.parsedPos = o, new Te(et.none, [], [], o - s);
                    },
                    stoppedAt: null,
                    stopAt () {}
                };
            }
        };
    }
    isDone(e) {
        e = Math.min(e, this.state.doc.length);
        let t = this.fragments;
        return this.treeLen >= e && t.length && t[0].from == 0 && t[0].to >= e;
    }
    static get() {
        return Zn;
    }
}
function tu(i, e, t) {
    return Wi.applyChanges(i, [
        {
            fromA: e,
            toA: t,
            fromB: e,
            toB: t
        }
    ]);
}
class yn {
    constructor(e){
        this.context = e, this.tree = e.tree;
    }
    apply(e) {
        if (!e.docChanged && this.tree == this.context.tree) return this;
        let t = this.context.changes(e.changes, e.state), n = this.context.treeLen == e.startState.doc.length ? void 0 : Math.max(e.changes.mapPos(this.context.treeLen), t.viewport.to);
        return t.work(20, n) || t.takeTree(), new yn(t);
    }
    static init(e) {
        let t = Math.min(3e3, e.doc.length), n = Qs.create(e.facet(Di).parser, e, {
            from: 0,
            to: t
        });
        return n.work(20, t) || n.takeTree(), new yn(n);
    }
}
kt.state = pt.define({
    create: yn.init,
    update (i, e) {
        for (let t of e.effects)if (t.is(kt.setState)) return t.value;
        return e.startState.facet(Di) != e.state.facet(Di) ? yn.init(e.state) : i.apply(e);
    }
});
let zp = (i)=>{
    let e = setTimeout(()=>i(), 500);
    return ()=>clearTimeout(e);
};
typeof requestIdleCallback < "u" && (zp = (i)=>{
    let e = -1, t = setTimeout(()=>{
        e = requestIdleCallback(i, {
            timeout: 400
        });
    }, 100);
    return ()=>e < 0 ? clearTimeout(t) : cancelIdleCallback(e);
});
const il = typeof navigator < "u" && !((tl = navigator.scheduling) === null || tl === void 0) && tl.isInputPending ? ()=>navigator.scheduling.isInputPending() : null, mb = Ie.fromClass(class {
    constructor(e){
        this.view = e, this.working = null, this.workScheduled = 0, this.chunkEnd = -1, this.chunkBudget = -1, this.work = this.work.bind(this), this.scheduleWork();
    }
    update(e) {
        let t = this.view.state.field(kt.state).context;
        (t.updateViewport(e.view.viewport) || this.view.viewport.to > t.treeLen) && this.scheduleWork(), (e.docChanged || e.selectionSet) && (this.view.hasFocus && (this.chunkBudget += 50), this.scheduleWork()), this.checkAsyncSchedule(t);
    }
    scheduleWork() {
        if (this.working) return;
        let { state: e } = this.view, t = e.field(kt.state);
        (t.tree != t.context.tree || !t.context.isDone(e.doc.length)) && (this.working = zp(this.work));
    }
    work(e) {
        this.working = null;
        let t = Date.now();
        if (this.chunkEnd < t && (this.chunkEnd < 0 || this.view.hasFocus) && (this.chunkEnd = t + 3e4, this.chunkBudget = 3e3), this.chunkBudget <= 0) return;
        let { state: n, viewport: { to: r } } = this.view, s = n.field(kt.state);
        if (s.tree == s.context.tree && s.context.isDone(r + 1e5)) return;
        let o = Date.now() + Math.min(this.chunkBudget, 100, e && !il ? Math.max(25, e.timeRemaining() - 5) : 1e9), l = s.context.treeLen < r && n.doc.length > r + 1e3, a = s.context.work(()=>il && il() || Date.now() > o, r + (l ? 0 : 1e5));
        this.chunkBudget -= Date.now() - t, (a || this.chunkBudget <= 0) && (s.context.takeTree(), this.view.dispatch({
            effects: kt.setState.of(new yn(s.context))
        })), this.chunkBudget > 0 && !(a && !l) && this.scheduleWork(), this.checkAsyncSchedule(s.context);
    }
    checkAsyncSchedule(e) {
        e.scheduleOn && (this.workScheduled++, e.scheduleOn.then(()=>this.scheduleWork()).catch((t)=>Tt(this.view.state, t)).then(()=>this.workScheduled--), e.scheduleOn = null);
    }
    destroy() {
        this.working && this.working();
    }
    isWorking() {
        return !!(this.working || this.workScheduled > 0);
    }
}, {
    eventHandlers: {
        focus () {
            this.scheduleWork();
        }
    }
}), Di = q.define({
    combine (i) {
        return i.length ? i[0] : null;
    },
    enables: (i)=>[
            kt.state,
            mb,
            $.contentAttributes.compute([
                i
            ], (e)=>{
                let t = e.facet(i);
                return t && t.name ? {
                    "data-language": t.name
                } : {};
            })
        ]
});
class yb {
    constructor(e, t = []){
        this.language = e, this.support = t, this.extension = [
            e,
            t
        ];
    }
}
const bb = q.define(), Tc = q.define({
    combine: (i)=>{
        if (!i.length) return "  ";
        let e = i[0];
        if (!e || /\S/.test(e) || Array.from(e).some((t)=>t != e[0])) throw new Error("Invalid indent unit: " + JSON.stringify(i[0]));
        return e;
    }
});
function Ys(i) {
    let e = i.facet(Tc);
    return e.charCodeAt(0) == 9 ? i.tabSize * e.length : e.length;
}
function Xs(i, e) {
    let t = "", n = i.tabSize, r = i.facet(Tc)[0];
    if (r == "	") {
        for(; e >= n;)t += "	", e -= n;
        r = " ";
    }
    for(let s = 0; s < e; s++)t += r;
    return t;
}
function Up(i, e) {
    i instanceof ie && (i = new xo(i));
    for (let n of i.state.facet(bb)){
        let r = n(i, e);
        if (r !== void 0) return r;
    }
    let t = tt(i.state);
    return t.length >= e ? wb(i, t, e) : null;
}
class xo {
    constructor(e, t = {}){
        this.state = e, this.options = t, this.unit = Ys(e);
    }
    lineAt(e, t = 1) {
        let n = this.state.doc.lineAt(e), { simulateBreak: r, simulateDoubleBreak: s } = this.options;
        return r != null && r >= n.from && r <= n.to ? s && r == e ? {
            text: "",
            from: e
        } : (t < 0 ? r < e : r <= e) ? {
            text: n.text.slice(r - n.from),
            from: r
        } : {
            text: n.text.slice(0, r - n.from),
            from: n.from
        } : n;
    }
    textAfterPos(e, t = 1) {
        if (this.options.simulateDoubleBreak && e == this.options.simulateBreak) return "";
        let { text: n, from: r } = this.lineAt(e, t);
        return n.slice(e - r, Math.min(n.length, e + 100 - r));
    }
    column(e, t = 1) {
        let { text: n, from: r } = this.lineAt(e, t), s = this.countColumn(n, e - r), o = this.options.overrideIndentation ? this.options.overrideIndentation(r) : -1;
        return o > -1 && (s += o - this.countColumn(n, n.search(/\S|$/))), s;
    }
    countColumn(e, t = e.length) {
        return Ar(e, this.state.tabSize, t);
    }
    lineIndent(e, t = 1) {
        let { text: n, from: r } = this.lineAt(e, t), s = this.options.overrideIndentation;
        if (s) {
            let o = s(r);
            if (o > -1) return o;
        }
        return this.countColumn(n, n.search(/\S|$/));
    }
    get simulatedBreak() {
        return this.options.simulateBreak || null;
    }
}
const vb = new Q;
function wb(i, e, t) {
    let n = e.resolveStack(t), r = n.node.enterUnfinishedNodesBefore(t);
    if (r != n.node) {
        let s = [];
        for(let o = r; o != n.node; o = o.parent)s.push(o);
        for(let o = s.length - 1; o >= 0; o--)n = {
            node: s[o],
            next: n
        };
    }
    return Kp(n, i, t);
}
function Kp(i, e, t) {
    for(let n = i; n; n = n.next){
        let r = Sb(n.node);
        if (r) return r(xc.create(e, t, n));
    }
    return 0;
}
function kb(i) {
    return i.pos == i.options.simulateBreak && i.options.simulateDoubleBreak;
}
function Sb(i) {
    let e = i.type.prop(vb);
    if (e) return e;
    let t = i.firstChild, n;
    if (t && (n = t.type.prop(Q.closedBy))) {
        let r = i.lastChild, s = r && n.indexOf(r.name) > -1;
        return (o)=>Rb(o, !0, 1, void 0, s && !kb(o) ? r.from : void 0);
    }
    return i.parent == null ? Cb : null;
}
function Cb() {
    return 0;
}
class xc extends xo {
    constructor(e, t, n){
        super(e.state, e.options), this.base = e, this.pos = t, this.context = n;
    }
    get node() {
        return this.context.node;
    }
    static create(e, t, n) {
        return new xc(e, t, n);
    }
    get textAfter() {
        return this.textAfterPos(this.pos);
    }
    get baseIndent() {
        return this.baseIndentFor(this.node);
    }
    baseIndentFor(e) {
        let t = this.state.doc.lineAt(e.from);
        for(;;){
            let n = e.resolve(t.from);
            for(; n.parent && n.parent.from == n.from;)n = n.parent;
            if (Tb(n, e)) break;
            t = this.state.doc.lineAt(n.from);
        }
        return this.lineIndent(t.from);
    }
    continue() {
        return Kp(this.context.next, this.base, this.pos);
    }
}
function Tb(i, e) {
    for(let t = e; t; t = t.parent)if (i == t) return !0;
    return !1;
}
function xb(i) {
    let e = i.node, t = e.childAfter(e.from), n = e.lastChild;
    if (!t) return null;
    let r = i.options.simulateBreak, s = i.state.doc.lineAt(t.from), o = r == null || r <= s.from ? s.to : Math.min(s.to, r);
    for(let l = t.to;;){
        let a = e.childAfter(l);
        if (!a || a == n) return null;
        if (!a.type.isSkipped) return a.from < o ? t : null;
        l = a.to;
    }
}
function Rb(i, e, t, n, r) {
    let s = i.textAfter, o = s.match(/^\s*/)[0].length, l = n && s.slice(o, o + n.length) == n || r == i.pos + o, a = e ? xb(i) : null;
    return a ? l ? i.column(a.from) : i.column(a.to) : i.baseIndent + (l ? 0 : i.unit * t);
}
const Ob = q.define(), Gp = new Q;
function Db(i) {
    let e = i.firstChild, t = i.lastChild;
    return e && e.to < t.from ? {
        from: e.to,
        to: t.type.isError ? i.to : t.from
    } : null;
}
function Pb(i, e, t) {
    let n = tt(i);
    if (n.length < t) return null;
    let r = n.resolveStack(t, 1), s = null;
    for(let o = r; o; o = o.next){
        let l = o.node;
        if (l.to <= t || l.from > t) continue;
        if (s && l.from < e) break;
        let a = l.type.prop(Gp);
        if (a && (l.to < n.length - 50 || n.length == i.doc.length || !Mb(l))) {
            let c = a(l, i);
            c && c.from <= t && c.from >= e && c.to > t && (s = c);
        }
    }
    return s;
}
function Mb(i) {
    let e = i.lastChild;
    return e && e.to == i.to && e.type.isError;
}
function iu(i, e, t) {
    for (let n of i.facet(Ob)){
        let r = n(i, e, t);
        if (r) return r;
    }
    return Pb(i, e, t);
}
function Jp(i, e) {
    let t = e.mapPos(i.from, 1), n = e.mapPos(i.to, -1);
    return t >= n ? void 0 : {
        from: t,
        to: n
    };
}
const Qp = Z.define({
    map: Jp
}), Rc = Z.define({
    map: Jp
}), Zs = pt.define({
    create () {
        return ee.none;
    },
    update (i, e) {
        i = i.map(e.changes);
        for (let t of e.effects)if (t.is(Qp) && !Ab(i, t.value.from, t.value.to)) {
            let { preparePlaceholder: n } = e.state.facet(Oc), r = n ? ee.replace({
                widget: new Eb(n(e.state, t.value))
            }) : nu;
            i = i.update({
                add: [
                    r.range(t.value.from, t.value.to)
                ]
            });
        } else t.is(Rc) && (i = i.update({
            filter: (n, r)=>t.value.from != n || t.value.to != r,
            filterFrom: t.value.from,
            filterTo: t.value.to
        }));
        if (e.selection) {
            let t = !1, { head: n } = e.selection.main;
            i.between(n, n, (r, s)=>{
                r < n && s > n && (t = !0);
            }), t && (i = i.update({
                filterFrom: n,
                filterTo: n,
                filter: (r, s)=>s <= n || r >= n
            }));
        }
        return i;
    },
    provide: (i)=>$.decorations.from(i),
    toJSON (i, e) {
        let t = [];
        return i.between(0, e.doc.length, (n, r)=>{
            t.push(n, r);
        }), t;
    },
    fromJSON (i) {
        if (!Array.isArray(i) || i.length % 2) throw new RangeError("Invalid JSON for fold state");
        let e = [];
        for(let t = 0; t < i.length;){
            let n = i[t++], r = i[t++];
            if (typeof n != "number" || typeof r != "number") throw new RangeError("Invalid JSON for fold state");
            e.push(nu.range(n, r));
        }
        return ee.set(e, !0);
    }
});
function Yl(i, e, t) {
    var n;
    let r = null;
    return (n = i.field(Zs, !1)) === null || n === void 0 || n.between(e, t, (s, o)=>{
        (!r || r.from > s) && (r = {
            from: s,
            to: o
        });
    }), r;
}
function Ab(i, e, t) {
    let n = !1;
    return i.between(e, e, (r, s)=>{
        r == e && s == t && (n = !0);
    }), n;
}
const _b = {
    placeholderDOM: null,
    preparePlaceholder: null,
    placeholderText: "\u2026"
}, Oc = q.define({
    combine (i) {
        return En(i, _b);
    }
});
function Yp(i) {
    let e = [
        Zs,
        Bb
    ];
    return i && e.push(Oc.of(i)), e;
}
function Xp(i, e) {
    let { state: t } = i, n = t.facet(Oc), r = (o)=>{
        let l = i.lineBlockAt(i.posAtDOM(o.target)), a = Yl(i.state, l.from, l.to);
        a && i.dispatch({
            effects: Rc.of(a)
        }), o.preventDefault();
    };
    if (n.placeholderDOM) return n.placeholderDOM(i, r, e);
    let s = document.createElement("span");
    return s.textContent = n.placeholderText, s.setAttribute("aria-label", t.phrase("folded code")), s.title = t.phrase("unfold"), s.className = "cm-foldPlaceholder", s.onclick = r, s;
}
const nu = ee.replace({
    widget: new class extends li {
        toDOM(i) {
            return Xp(i, null);
        }
    }
});
class Eb extends li {
    constructor(e){
        super(), this.value = e;
    }
    eq(e) {
        return this.value == e.value;
    }
    toDOM(e) {
        return Xp(e, this.value);
    }
}
const Nb = {
    openText: "\u2304",
    closedText: "\u203A",
    markerDOM: null,
    domEventHandlers: {},
    foldingChanged: ()=>!1
};
class nl extends Ki {
    constructor(e, t){
        super(), this.config = e, this.open = t;
    }
    eq(e) {
        return this.config == e.config && this.open == e.open;
    }
    toDOM(e) {
        if (this.config.markerDOM) return this.config.markerDOM(this.open);
        let t = document.createElement("span");
        return t.textContent = this.open ? this.config.openText : this.config.closedText, t.title = e.state.phrase(this.open ? "Fold line" : "Unfold line"), t;
    }
}
function Lb(i = {}) {
    let e = Object.assign(Object.assign({}, Nb), i), t = new nl(e, !0), n = new nl(e, !1), r = Ie.fromClass(class {
        constructor(o){
            this.from = o.viewport.from, this.markers = this.buildMarkers(o);
        }
        update(o) {
            (o.docChanged || o.viewportChanged || o.startState.facet(Di) != o.state.facet(Di) || o.startState.field(Zs, !1) != o.state.field(Zs, !1) || tt(o.startState) != tt(o.state) || e.foldingChanged(o)) && (this.markers = this.buildMarkers(o.view));
        }
        buildMarkers(o) {
            let l = new zi;
            for (let a of o.viewportLineBlocks){
                let c = Yl(o.state, a.from, a.to) ? n : iu(o.state, a.from, a.to) ? t : null;
                c && l.add(a.from, a.from, c);
            }
            return l.finish();
        }
    }), { domEventHandlers: s } = e;
    return [
        r,
        Ky({
            class: "cm-foldGutter",
            markers (o) {
                var l;
                return ((l = o.plugin(r)) === null || l === void 0 ? void 0 : l.markers) || le.empty;
            },
            initialSpacer () {
                return new nl(e, !1);
            },
            domEventHandlers: Object.assign(Object.assign({}, s), {
                click: (o, l, a)=>{
                    if (s.click && s.click(o, l, a)) return !0;
                    let c = Yl(o.state, l.from, l.to);
                    if (c) return o.dispatch({
                        effects: Rc.of(c)
                    }), !0;
                    let h = iu(o.state, l.from, l.to);
                    return h ? (o.dispatch({
                        effects: Qp.of(h)
                    }), !0) : !1;
                }
            })
        }),
        Yp()
    ];
}
const Bb = $.baseTheme({
    ".cm-foldPlaceholder": {
        backgroundColor: "#eee",
        border: "1px solid #ddd",
        color: "#888",
        borderRadius: ".2em",
        margin: "0 1px",
        padding: "0 1px",
        cursor: "pointer"
    },
    ".cm-foldGutter span": {
        padding: "0 1px",
        cursor: "pointer"
    }
});
class Lr {
    constructor(e, t){
        this.specs = e;
        let n;
        function r(l) {
            let a = xi.newName();
            return (n || (n = Object.create(null)))["." + a] = l, a;
        }
        const s = typeof t.all == "string" ? t.all : t.all ? r(t.all) : void 0, o = t.scope;
        this.scope = o instanceof kt ? (l)=>l.prop(on) == o.data : o ? (l)=>l == o : void 0, this.style = $p(e.map((l)=>({
                tag: l.tag,
                class: l.class || r(Object.assign({}, l, {
                    tag: null
                }))
            })), {
            all: s
        }).style, this.module = n ? new xi(n) : null, this.themeType = t.themeType;
    }
    static define(e, t) {
        return new Lr(e, t || {});
    }
}
const Xl = q.define(), Zp = q.define({
    combine (i) {
        return i.length ? [
            i[0]
        ] : null;
    }
});
function rl(i) {
    let e = i.facet(Xl);
    return e.length ? e : i.facet(Zp);
}
function eg(i, e) {
    let t = [
        qb
    ], n;
    return i instanceof Lr && (i.module && t.push($.styleModule.of(i.module)), n = i.themeType), e != null && e.fallback ? t.push(Zp.of(i)) : n ? t.push(Xl.computeN([
        $.darkTheme
    ], (r)=>r.facet($.darkTheme) == (n == "dark") ? [
            i
        ] : [])) : t.push(Xl.of(i)), t;
}
class Ib {
    constructor(e){
        this.markCache = Object.create(null), this.tree = tt(e.state), this.decorations = this.buildDeco(e, rl(e.state));
    }
    update(e) {
        let t = tt(e.state), n = rl(e.state), r = n != rl(e.startState);
        t.length < e.view.viewport.to && !r && t.type == this.tree.type ? this.decorations = this.decorations.map(e.changes) : (t != this.tree || e.viewportChanged || r) && (this.tree = t, this.decorations = this.buildDeco(e.view, n));
    }
    buildDeco(e, t) {
        if (!t || !this.tree.length) return ee.none;
        let n = new zi;
        for (let { from: r, to: s } of e.visibleRanges)hb(this.tree, t, (o, l, a)=>{
            n.add(o, l, this.markCache[a] || (this.markCache[a] = ee.mark({
                class: a
            })));
        }, r, s);
        return n.finish();
    }
}
const qb = Mr.high(Ie.fromClass(Ib, {
    decorations: (i)=>i.decorations
})), jb = Lr.define([
    {
        tag: P.meta,
        color: "#404740"
    },
    {
        tag: P.link,
        textDecoration: "underline"
    },
    {
        tag: P.heading,
        textDecoration: "underline",
        fontWeight: "bold"
    },
    {
        tag: P.emphasis,
        fontStyle: "italic"
    },
    {
        tag: P.strong,
        fontWeight: "bold"
    },
    {
        tag: P.strikethrough,
        textDecoration: "line-through"
    },
    {
        tag: P.keyword,
        color: "#708"
    },
    {
        tag: [
            P.atom,
            P.bool,
            P.url,
            P.contentSeparator,
            P.labelName
        ],
        color: "#219"
    },
    {
        tag: [
            P.literal,
            P.inserted
        ],
        color: "#164"
    },
    {
        tag: [
            P.string,
            P.deleted
        ],
        color: "#a11"
    },
    {
        tag: [
            P.regexp,
            P.escape,
            P.special(P.string)
        ],
        color: "#e40"
    },
    {
        tag: P.definition(P.variableName),
        color: "#00f"
    },
    {
        tag: P.local(P.variableName),
        color: "#30a"
    },
    {
        tag: [
            P.typeName,
            P.namespace
        ],
        color: "#085"
    },
    {
        tag: P.className,
        color: "#167"
    },
    {
        tag: [
            P.special(P.variableName),
            P.macroName
        ],
        color: "#256"
    },
    {
        tag: P.definition(P.propertyName),
        color: "#00c"
    },
    {
        tag: P.comment,
        color: "#940"
    },
    {
        tag: P.invalid,
        color: "#f00"
    }
]), Fb = 1e4, Hb = "()[]{}", Wb = new Q;
function Zl(i, e, t) {
    let n = i.prop(e < 0 ? Q.openedBy : Q.closedBy);
    if (n) return n;
    if (i.name.length == 1) {
        let r = t.indexOf(i.name);
        if (r > -1 && r % 2 == (e < 0 ? 1 : 0)) return [
            t[r + e]
        ];
    }
    return null;
}
function ea(i) {
    let e = i.type.prop(Wb);
    return e ? e(i.node) : i;
}
function ln(i, e, t, n = {}) {
    let r = n.maxScanDistance || Fb, s = n.brackets || Hb, o = tt(i), l = o.resolveInner(e, t);
    for(let a = l; a; a = a.parent){
        let c = Zl(a.type, t, s);
        if (c && a.from < a.to) {
            let h = ea(a);
            if (h && (t > 0 ? e >= h.from && e < h.to : e > h.from && e <= h.to)) return Vb(i, e, t, a, h, c, s);
        }
    }
    return $b(i, e, t, o, l.type, r, s);
}
function Vb(i, e, t, n, r, s, o) {
    let l = n.parent, a = {
        from: r.from,
        to: r.to
    }, c = 0, h = l == null ? void 0 : l.cursor();
    if (h && (t < 0 ? h.childBefore(n.from) : h.childAfter(n.to))) do if (t < 0 ? h.to <= n.from : h.from >= n.to) {
        if (c == 0 && s.indexOf(h.type.name) > -1 && h.from < h.to) {
            let u = ea(h);
            return {
                start: a,
                end: u ? {
                    from: u.from,
                    to: u.to
                } : void 0,
                matched: !0
            };
        } else if (Zl(h.type, t, o)) c++;
        else if (Zl(h.type, -t, o)) {
            if (c == 0) {
                let u = ea(h);
                return {
                    start: a,
                    end: u && u.from < u.to ? {
                        from: u.from,
                        to: u.to
                    } : void 0,
                    matched: !1
                };
            }
            c--;
        }
    }
    while (t < 0 ? h.prevSibling() : h.nextSibling());
    return {
        start: a,
        matched: !1
    };
}
function $b(i, e, t, n, r, s, o) {
    let l = t < 0 ? i.sliceDoc(e - 1, e) : i.sliceDoc(e, e + 1), a = o.indexOf(l);
    if (a < 0 || a % 2 == 0 != t > 0) return null;
    let c = {
        from: t < 0 ? e - 1 : e,
        to: t > 0 ? e + 1 : e
    }, h = i.doc.iterRange(e, t > 0 ? i.doc.length : 0), u = 0;
    for(let f = 0; !h.next().done && f <= s;){
        let d = h.value;
        t < 0 && (f += d.length);
        let p = e + f * t;
        for(let y = t > 0 ? 0 : d.length - 1, b = t > 0 ? d.length : -1; y != b; y += t){
            let k = o.indexOf(d[y]);
            if (!(k < 0 || n.resolveInner(p + y, 1).type != r)) {
                if (k % 2 == 0 == t > 0) u++;
                else {
                    if (u == 1) return {
                        start: c,
                        end: {
                            from: p + y,
                            to: p + y + 1
                        },
                        matched: k >> 1 == a >> 1
                    };
                    u--;
                }
            }
        }
        t > 0 && (f += d.length);
    }
    return h.done ? {
        start: c,
        matched: !1
    } : null;
}
const zb = Object.create(null), ru = [
    et.none
], su = [], Ub = Object.create(null);
for (let [i, e] of [
    [
        "variable",
        "variableName"
    ],
    [
        "variable-2",
        "variableName.special"
    ],
    [
        "string-2",
        "string.special"
    ],
    [
        "def",
        "variableName.definition"
    ],
    [
        "tag",
        "tagName"
    ],
    [
        "attribute",
        "attributeName"
    ],
    [
        "type",
        "typeName"
    ],
    [
        "builtin",
        "variableName.standard"
    ],
    [
        "qualifier",
        "modifier"
    ],
    [
        "error",
        "invalid"
    ],
    [
        "header",
        "heading"
    ],
    [
        "property",
        "propertyName"
    ]
])Ub[i] = Kb(zb, e);
function sl(i, e) {
    su.indexOf(i) > -1 || (su.push(i), console.warn(e));
}
function Kb(i, e) {
    let t = [];
    for (let s of e.split(" ")){
        let o = [];
        for (let l of s.split(".")){
            let a = i[l] || P[l];
            a ? typeof a == "function" ? o.length ? o = o.map(a) : sl(l, `Modifier ${l} used at start of tag`) : o.length ? sl(l, `Tag ${l} used as modifier`) : o = Array.isArray(a) ? a : [
                a
            ] : sl(l, `Unknown highlighting tag ${l}`);
        }
        for (let l of o)t.push(l);
    }
    if (!t.length) return 0;
    let n = e.replace(/ /g, "_"), r = et.define({
        id: ru.length,
        name: n,
        props: [
            Wp({
                [n]: t
            })
        ]
    });
    return ru.push(r), r.id;
}
const Gb = (i)=>{
    let { state: e } = i, t = e.doc.lineAt(e.selection.main.from), n = Pc(i.state, t.from);
    return n.line ? Jb(i) : n.block ? Yb(i) : !1;
};
function Dc(i, e) {
    return ({ state: t, dispatch: n })=>{
        if (t.readOnly) return !1;
        let r = i(e, t);
        return r ? (n(t.update(r)), !0) : !1;
    };
}
const Jb = Dc(ev, 0), Qb = Dc(tg, 0), Yb = Dc((i, e)=>tg(i, e, Zb(e)), 0);
function Pc(i, e) {
    let t = i.languageDataAt("commentTokens", e);
    return t.length ? t[0] : {};
}
const er = 50;
function Xb(i, { open: e, close: t }, n, r) {
    let s = i.sliceDoc(n - er, n), o = i.sliceDoc(r, r + er), l = /\s*$/.exec(s)[0].length, a = /^\s*/.exec(o)[0].length, c = s.length - l;
    if (s.slice(c - e.length, c) == e && o.slice(a, a + t.length) == t) return {
        open: {
            pos: n - l,
            margin: l && 1
        },
        close: {
            pos: r + a,
            margin: a && 1
        }
    };
    let h, u;
    r - n <= 2 * er ? h = u = i.sliceDoc(n, r) : (h = i.sliceDoc(n, n + er), u = i.sliceDoc(r - er, r));
    let f = /^\s*/.exec(h)[0].length, d = /\s*$/.exec(u)[0].length, p = u.length - d - t.length;
    return h.slice(f, f + e.length) == e && u.slice(p, p + t.length) == t ? {
        open: {
            pos: n + f + e.length,
            margin: /\s/.test(h.charAt(f + e.length)) ? 1 : 0
        },
        close: {
            pos: r - d - t.length,
            margin: /\s/.test(u.charAt(p - 1)) ? 1 : 0
        }
    } : null;
}
function Zb(i) {
    let e = [];
    for (let t of i.selection.ranges){
        let n = i.doc.lineAt(t.from), r = t.to <= n.to ? n : i.doc.lineAt(t.to), s = e.length - 1;
        s >= 0 && e[s].to > n.from ? e[s].to = r.to : e.push({
            from: n.from + /^\s*/.exec(n.text)[0].length,
            to: r.to
        });
    }
    return e;
}
function tg(i, e, t = e.selection.ranges) {
    let n = t.map((s)=>Pc(e, s.from).block);
    if (!n.every((s)=>s)) return null;
    let r = t.map((s, o)=>Xb(e, n[o], s.from, s.to));
    if (i != 2 && !r.every((s)=>s)) return {
        changes: e.changes(t.map((s, o)=>r[o] ? [] : [
                {
                    from: s.from,
                    insert: n[o].open + " "
                },
                {
                    from: s.to,
                    insert: " " + n[o].close
                }
            ]))
    };
    if (i != 1 && r.some((s)=>s)) {
        let s = [];
        for(let o = 0, l; o < r.length; o++)if (l = r[o]) {
            let a = n[o], { open: c, close: h } = l;
            s.push({
                from: c.pos - a.open.length,
                to: c.pos + c.margin
            }, {
                from: h.pos - h.margin,
                to: h.pos + a.close.length
            });
        }
        return {
            changes: s
        };
    }
    return null;
}
function ev(i, e, t = e.selection.ranges) {
    let n = [], r = -1;
    for (let { from: s, to: o } of t){
        let l = n.length, a = 1e9, c = Pc(e, s).line;
        if (c) {
            for(let h = s; h <= o;){
                let u = e.doc.lineAt(h);
                if (u.from > r && (s == o || o > u.from)) {
                    r = u.from;
                    let f = /^\s*/.exec(u.text)[0].length, d = f == u.length, p = u.text.slice(f, f + c.length) == c ? f : -1;
                    f < u.text.length && f < a && (a = f), n.push({
                        line: u,
                        comment: p,
                        token: c,
                        indent: f,
                        empty: d,
                        single: !1
                    });
                }
                h = u.to + 1;
            }
            if (a < 1e9) for(let h = l; h < n.length; h++)n[h].indent < n[h].line.text.length && (n[h].indent = a);
            n.length == l + 1 && (n[l].single = !0);
        }
    }
    if (i != 2 && n.some((s)=>s.comment < 0 && (!s.empty || s.single))) {
        let s = [];
        for (let { line: l, token: a, indent: c, empty: h, single: u } of n)(u || !h) && s.push({
            from: l.from + c,
            insert: a + " "
        });
        let o = e.changes(s);
        return {
            changes: o,
            selection: e.selection.map(o, 1)
        };
    } else if (i != 1 && n.some((s)=>s.comment >= 0)) {
        let s = [];
        for (let { line: o, comment: l, token: a } of n)if (l >= 0) {
            let c = o.from + l, h = c + a.length;
            o.text[h - o.from] == " " && h++, s.push({
                from: c,
                to: h
            });
        }
        return {
            changes: s
        };
    }
    return null;
}
const ta = oi.define(), tv = oi.define(), iv = q.define(), ig = q.define({
    combine (i) {
        return En(i, {
            minDepth: 100,
            newGroupDelay: 500,
            joinToEvent: (e, t)=>t
        }, {
            minDepth: Math.max,
            newGroupDelay: Math.min,
            joinToEvent: (e, t)=>(n, r)=>e(n, r) || t(n, r)
        });
    }
});
function nv(i) {
    let e = 0;
    return i.iterChangedRanges((t, n)=>e = n), e;
}
const ng = pt.define({
    create () {
        return Ft.empty;
    },
    update (i, e) {
        let t = e.state.facet(ig), n = e.annotation(ta);
        if (n) {
            let a = e.docChanged ? O.single(nv(e.changes)) : void 0, c = Ze.fromTransaction(e, a), h = n.side, u = h == 0 ? i.undone : i.done;
            return c ? u = eo(u, u.length, t.minDepth, c) : u = og(u, e.startState.selection), new Ft(h == 0 ? n.rest : u, h == 0 ? u : n.rest);
        }
        let r = e.annotation(tv);
        if ((r == "full" || r == "before") && (i = i.isolate()), e.annotation(Pe.addToHistory) === !1) return e.changes.empty ? i : i.addMapping(e.changes.desc);
        let s = Ze.fromTransaction(e), o = e.annotation(Pe.time), l = e.annotation(Pe.userEvent);
        return s ? i = i.addChanges(s, o, l, t, e) : e.selection && (i = i.addSelection(e.startState.selection, o, l, t.newGroupDelay)), (r == "full" || r == "after") && (i = i.isolate()), i;
    },
    toJSON (i) {
        return {
            done: i.done.map((e)=>e.toJSON()),
            undone: i.undone.map((e)=>e.toJSON())
        };
    },
    fromJSON (i) {
        return new Ft(i.done.map(Ze.fromJSON), i.undone.map(Ze.fromJSON));
    }
});
function rv(i = {}) {
    return [
        ng,
        ig.of(i),
        $.domEventHandlers({
            beforeinput (e, t) {
                let n = e.inputType == "historyUndo" ? rg : e.inputType == "historyRedo" ? ia : null;
                return n ? (e.preventDefault(), n(t)) : !1;
            }
        })
    ];
}
function Ro(i, e) {
    return function({ state: t, dispatch: n }) {
        if (!e && t.readOnly) return !1;
        let r = t.field(ng, !1);
        if (!r) return !1;
        let s = r.pop(i, t, e);
        return s ? (n(s), !0) : !1;
    };
}
const rg = Ro(0, !1), ia = Ro(1, !1), sv = Ro(0, !0), ov = Ro(1, !0);
class Ze {
    constructor(e, t, n, r, s){
        this.changes = e, this.effects = t, this.mapped = n, this.startSelection = r, this.selectionsAfter = s;
    }
    setSelAfter(e) {
        return new Ze(this.changes, this.effects, this.mapped, this.startSelection, e);
    }
    toJSON() {
        var e, t, n;
        return {
            changes: (e = this.changes) === null || e === void 0 ? void 0 : e.toJSON(),
            mapped: (t = this.mapped) === null || t === void 0 ? void 0 : t.toJSON(),
            startSelection: (n = this.startSelection) === null || n === void 0 ? void 0 : n.toJSON(),
            selectionsAfter: this.selectionsAfter.map((r)=>r.toJSON())
        };
    }
    static fromJSON(e) {
        return new Ze(e.changes && De.fromJSON(e.changes), [], e.mapped && Ht.fromJSON(e.mapped), e.startSelection && O.fromJSON(e.startSelection), e.selectionsAfter.map(O.fromJSON));
    }
    static fromTransaction(e, t) {
        let n = ht;
        for (let r of e.startState.facet(iv)){
            let s = r(e);
            s.length && (n = n.concat(s));
        }
        return !n.length && e.changes.empty ? null : new Ze(e.changes.invert(e.startState.doc), n, void 0, t || e.startState.selection, ht);
    }
    static selection(e) {
        return new Ze(void 0, ht, void 0, void 0, e);
    }
}
function eo(i, e, t, n) {
    let r = e + 1 > t + 20 ? e - t - 1 : 0, s = i.slice(r, e);
    return s.push(n), s;
}
function lv(i, e) {
    let t = [], n = !1;
    return i.iterChangedRanges((r, s)=>t.push(r, s)), e.iterChangedRanges((r, s, o, l)=>{
        for(let a = 0; a < t.length;){
            let c = t[a++], h = t[a++];
            l >= c && o <= h && (n = !0);
        }
    }), n;
}
function av(i, e) {
    return i.ranges.length == e.ranges.length && i.ranges.filter((t, n)=>t.empty != e.ranges[n].empty).length === 0;
}
function sg(i, e) {
    return i.length ? e.length ? i.concat(e) : i : e;
}
const ht = [], cv = 200;
function og(i, e) {
    if (i.length) {
        let t = i[i.length - 1], n = t.selectionsAfter.slice(Math.max(0, t.selectionsAfter.length - cv));
        return n.length && n[n.length - 1].eq(e) ? i : (n.push(e), eo(i, i.length - 1, 1e9, t.setSelAfter(n)));
    } else return [
        Ze.selection([
            e
        ])
    ];
}
function hv(i) {
    let e = i[i.length - 1], t = i.slice();
    return t[i.length - 1] = e.setSelAfter(e.selectionsAfter.slice(0, e.selectionsAfter.length - 1)), t;
}
function ol(i, e) {
    if (!i.length) return i;
    let t = i.length, n = ht;
    for(; t;){
        let r = uv(i[t - 1], e, n);
        if (r.changes && !r.changes.empty || r.effects.length) {
            let s = i.slice(0, t);
            return s[t - 1] = r, s;
        } else e = r.mapped, t--, n = r.selectionsAfter;
    }
    return n.length ? [
        Ze.selection(n)
    ] : ht;
}
function uv(i, e, t) {
    let n = sg(i.selectionsAfter.length ? i.selectionsAfter.map((l)=>l.map(e)) : ht, t);
    if (!i.changes) return Ze.selection(n);
    let r = i.changes.map(e), s = e.mapDesc(i.changes, !0), o = i.mapped ? i.mapped.composeDesc(s) : s;
    return new Ze(r, Z.mapEffects(i.effects, e), o, i.startSelection.map(s), n);
}
const fv = /^(input\.type|delete)($|\.)/;
class Ft {
    constructor(e, t, n = 0, r){
        this.done = e, this.undone = t, this.prevTime = n, this.prevUserEvent = r;
    }
    isolate() {
        return this.prevTime ? new Ft(this.done, this.undone) : this;
    }
    addChanges(e, t, n, r, s) {
        let o = this.done, l = o[o.length - 1];
        return l && l.changes && !l.changes.empty && e.changes && (!n || fv.test(n)) && (!l.selectionsAfter.length && t - this.prevTime < r.newGroupDelay && r.joinToEvent(s, lv(l.changes, e.changes)) || n == "input.type.compose") ? o = eo(o, o.length - 1, r.minDepth, new Ze(e.changes.compose(l.changes), sg(e.effects, l.effects), l.mapped, l.startSelection, ht)) : o = eo(o, o.length, r.minDepth, e), new Ft(o, ht, t, n);
    }
    addSelection(e, t, n, r) {
        let s = this.done.length ? this.done[this.done.length - 1].selectionsAfter : ht;
        return s.length > 0 && t - this.prevTime < r && n == this.prevUserEvent && n && /^select($|\.)/.test(n) && av(s[s.length - 1], e) ? this : new Ft(og(this.done, e), this.undone, t, n);
    }
    addMapping(e) {
        return new Ft(ol(this.done, e), ol(this.undone, e), this.prevTime, this.prevUserEvent);
    }
    pop(e, t, n) {
        let r = e == 0 ? this.done : this.undone;
        if (r.length == 0) return null;
        let s = r[r.length - 1];
        if (n && s.selectionsAfter.length) return t.update({
            selection: s.selectionsAfter[s.selectionsAfter.length - 1],
            annotations: ta.of({
                side: e,
                rest: hv(r)
            }),
            userEvent: e == 0 ? "select.undo" : "select.redo",
            scrollIntoView: !0
        });
        if (s.changes) {
            let o = r.length == 1 ? ht : r.slice(0, r.length - 1);
            return s.mapped && (o = ol(o, s.mapped)), t.update({
                changes: s.changes,
                selection: s.startSelection,
                effects: s.effects,
                annotations: ta.of({
                    side: e,
                    rest: o
                }),
                filter: !1,
                userEvent: e == 0 ? "undo" : "redo",
                scrollIntoView: !0
            });
        } else return null;
    }
}
Ft.empty = new Ft(ht, ht);
const dv = [
    {
        key: "Mod-z",
        run: rg,
        preventDefault: !0
    },
    {
        key: "Mod-y",
        mac: "Mod-Shift-z",
        run: ia,
        preventDefault: !0
    },
    {
        linux: "Ctrl-Shift-z",
        run: ia,
        preventDefault: !0
    },
    {
        key: "Mod-u",
        run: sv,
        preventDefault: !0
    },
    {
        key: "Alt-u",
        mac: "Mod-Shift-u",
        run: ov,
        preventDefault: !0
    }
];
function Nn(i, e) {
    return O.create(i.ranges.map(e), i.mainIndex);
}
function Ut(i, e) {
    return i.update({
        selection: e,
        scrollIntoView: !0,
        userEvent: "select"
    });
}
function Rt({ state: i, dispatch: e }, t) {
    let n = Nn(i.selection, t);
    return n.eq(i.selection) ? !1 : (e(Ut(i, n)), !0);
}
function Oo(i, e) {
    return O.cursor(e ? i.to : i.from);
}
function lg(i, e) {
    return Rt(i, (t)=>t.empty ? i.moveByChar(t, e) : Oo(t, e));
}
function Ve(i) {
    return i.textDirectionAt(i.state.selection.main.head) == ge.LTR;
}
const ag = (i)=>lg(i, !Ve(i)), cg = (i)=>lg(i, Ve(i));
function hg(i, e) {
    return Rt(i, (t)=>t.empty ? i.moveByGroup(t, e) : Oo(t, e));
}
const pv = (i)=>hg(i, !Ve(i)), gv = (i)=>hg(i, Ve(i));
function mv(i, e, t) {
    if (e.type.prop(t)) return !0;
    let n = e.to - e.from;
    return n && (n > 2 || /[^\s,.;:]/.test(i.sliceDoc(e.from, e.to))) || e.firstChild;
}
function Do(i, e, t) {
    let n = tt(i).resolveInner(e.head), r = t ? Q.closedBy : Q.openedBy;
    for(let a = e.head;;){
        let c = t ? n.childAfter(a) : n.childBefore(a);
        if (!c) break;
        mv(i, c, r) ? n = c : a = t ? c.to : c.from;
    }
    let s = n.type.prop(r), o, l;
    return s && (o = t ? ln(i, n.from, 1) : ln(i, n.to, -1)) && o.matched ? l = t ? o.end.to : o.end.from : l = t ? n.to : n.from, O.cursor(l, t ? -1 : 1);
}
const yv = (i)=>Rt(i, (e)=>Do(i.state, e, !Ve(i))), bv = (i)=>Rt(i, (e)=>Do(i.state, e, Ve(i)));
function ug(i, e) {
    return Rt(i, (t)=>{
        if (!t.empty) return Oo(t, e);
        let n = i.moveVertically(t, e);
        return n.head != t.head ? n : i.moveToLineBoundary(t, e);
    });
}
const fg = (i)=>ug(i, !1), dg = (i)=>ug(i, !0);
function pg(i) {
    let e = i.scrollDOM.clientHeight < i.scrollDOM.scrollHeight - 2, t = 0, n = 0, r;
    if (e) {
        for (let s of i.state.facet($.scrollMargins)){
            let o = s(i);
            o != null && o.top && (t = Math.max(o == null ? void 0 : o.top, t)), o != null && o.bottom && (n = Math.max(o == null ? void 0 : o.bottom, n));
        }
        r = i.scrollDOM.clientHeight - t - n;
    } else r = (i.dom.ownerDocument.defaultView || window).innerHeight;
    return {
        marginTop: t,
        marginBottom: n,
        selfScroll: e,
        height: Math.max(i.defaultLineHeight, r - 5)
    };
}
function gg(i, e) {
    let t = pg(i), { state: n } = i, r = Nn(n.selection, (o)=>o.empty ? i.moveVertically(o, e, t.height) : Oo(o, e));
    if (r.eq(n.selection)) return !1;
    let s;
    if (t.selfScroll) {
        let o = i.coordsAtPos(n.selection.main.head), l = i.scrollDOM.getBoundingClientRect(), a = l.top + t.marginTop, c = l.bottom - t.marginBottom;
        o && o.top > a && o.bottom < c && (s = $.scrollIntoView(r.main.head, {
            y: "start",
            yMargin: o.top - a
        }));
    }
    return i.dispatch(Ut(n, r), {
        effects: s
    }), !0;
}
const ou = (i)=>gg(i, !1), na = (i)=>gg(i, !0);
function Pi(i, e, t) {
    let n = i.lineBlockAt(e.head), r = i.moveToLineBoundary(e, t);
    if (r.head == e.head && r.head != (t ? n.to : n.from) && (r = i.moveToLineBoundary(e, t, !1)), !t && r.head == n.from && n.length) {
        let s = /^\s*/.exec(i.state.sliceDoc(n.from, Math.min(n.from + 100, n.to)))[0].length;
        s && e.head != n.from + s && (r = O.cursor(n.from + s));
    }
    return r;
}
const vv = (i)=>Rt(i, (e)=>Pi(i, e, !0)), wv = (i)=>Rt(i, (e)=>Pi(i, e, !1)), kv = (i)=>Rt(i, (e)=>Pi(i, e, !Ve(i))), Sv = (i)=>Rt(i, (e)=>Pi(i, e, Ve(i))), Cv = (i)=>Rt(i, (e)=>O.cursor(i.lineBlockAt(e.head).from, 1)), Tv = (i)=>Rt(i, (e)=>O.cursor(i.lineBlockAt(e.head).to, -1));
function xv(i, e, t) {
    let n = !1, r = Nn(i.selection, (s)=>{
        let o = ln(i, s.head, -1) || ln(i, s.head, 1) || s.head > 0 && ln(i, s.head - 1, 1) || s.head < i.doc.length && ln(i, s.head + 1, -1);
        if (!o || !o.end) return s;
        n = !0;
        let l = o.start.from == s.head ? o.end.to : o.end.from;
        return t ? O.range(s.anchor, l) : O.cursor(l);
    });
    return n ? (e(Ut(i, r)), !0) : !1;
}
const Rv = ({ state: i, dispatch: e })=>xv(i, e, !1);
function gt(i, e) {
    let t = Nn(i.state.selection, (n)=>{
        let r = e(n);
        return O.range(n.anchor, r.head, r.goalColumn, r.bidiLevel || void 0);
    });
    return t.eq(i.state.selection) ? !1 : (i.dispatch(Ut(i.state, t)), !0);
}
function mg(i, e) {
    return gt(i, (t)=>i.moveByChar(t, e));
}
const yg = (i)=>mg(i, !Ve(i)), bg = (i)=>mg(i, Ve(i));
function vg(i, e) {
    return gt(i, (t)=>i.moveByGroup(t, e));
}
const Ov = (i)=>vg(i, !Ve(i)), Dv = (i)=>vg(i, Ve(i)), Pv = (i)=>gt(i, (e)=>Do(i.state, e, !Ve(i))), Mv = (i)=>gt(i, (e)=>Do(i.state, e, Ve(i)));
function wg(i, e) {
    return gt(i, (t)=>i.moveVertically(t, e));
}
const kg = (i)=>wg(i, !1), Sg = (i)=>wg(i, !0);
function Cg(i, e) {
    return gt(i, (t)=>i.moveVertically(t, e, pg(i).height));
}
const lu = (i)=>Cg(i, !1), au = (i)=>Cg(i, !0), Av = (i)=>gt(i, (e)=>Pi(i, e, !0)), _v = (i)=>gt(i, (e)=>Pi(i, e, !1)), Ev = (i)=>gt(i, (e)=>Pi(i, e, !Ve(i))), Nv = (i)=>gt(i, (e)=>Pi(i, e, Ve(i))), Lv = (i)=>gt(i, (e)=>O.cursor(i.lineBlockAt(e.head).from)), Bv = (i)=>gt(i, (e)=>O.cursor(i.lineBlockAt(e.head).to)), cu = ({ state: i, dispatch: e })=>(e(Ut(i, {
        anchor: 0
    })), !0), hu = ({ state: i, dispatch: e })=>(e(Ut(i, {
        anchor: i.doc.length
    })), !0), uu = ({ state: i, dispatch: e })=>(e(Ut(i, {
        anchor: i.selection.main.anchor,
        head: 0
    })), !0), fu = ({ state: i, dispatch: e })=>(e(Ut(i, {
        anchor: i.selection.main.anchor,
        head: i.doc.length
    })), !0), Iv = ({ state: i, dispatch: e })=>(e(i.update({
        selection: {
            anchor: 0,
            head: i.doc.length
        },
        userEvent: "select"
    })), !0), qv = ({ state: i, dispatch: e })=>{
    let t = Po(i).map(({ from: n, to: r })=>O.range(n, Math.min(r + 1, i.doc.length)));
    return e(i.update({
        selection: O.create(t),
        userEvent: "select"
    })), !0;
}, jv = ({ state: i, dispatch: e })=>{
    let t = Nn(i.selection, (n)=>{
        var r;
        let s = tt(i).resolveStack(n.from, 1);
        for(let o = s; o; o = o.next){
            let { node: l } = o;
            if ((l.from < n.from && l.to >= n.to || l.to > n.to && l.from <= n.from) && !((r = l.parent) === null || r === void 0) && r.parent) return O.range(l.to, l.from);
        }
        return n;
    });
    return e(Ut(i, t)), !0;
}, Fv = ({ state: i, dispatch: e })=>{
    let t = i.selection, n = null;
    return t.ranges.length > 1 ? n = O.create([
        t.main
    ]) : t.main.empty || (n = O.create([
        O.cursor(t.main.head)
    ])), n ? (e(Ut(i, n)), !0) : !1;
};
function Br(i, e) {
    if (i.state.readOnly) return !1;
    let t = "delete.selection", { state: n } = i, r = n.changeByRange((s)=>{
        let { from: o, to: l } = s;
        if (o == l) {
            let a = e(s);
            a < o ? (t = "delete.backward", a = ws(i, a, !1)) : a > o && (t = "delete.forward", a = ws(i, a, !0)), o = Math.min(o, a), l = Math.max(l, a);
        } else o = ws(i, o, !1), l = ws(i, l, !0);
        return o == l ? {
            range: s
        } : {
            changes: {
                from: o,
                to: l
            },
            range: O.cursor(o, o < s.head ? -1 : 1)
        };
    });
    return r.changes.empty ? !1 : (i.dispatch(n.update(r, {
        scrollIntoView: !0,
        userEvent: t,
        effects: t == "delete.selection" ? $.announce.of(n.phrase("Selection deleted")) : void 0
    })), !0);
}
function ws(i, e, t) {
    if (i instanceof $) for (let n of i.state.facet($.atomicRanges).map((r)=>r(i)))n.between(e, e, (r, s)=>{
        r < e && s > e && (e = t ? s : r);
    });
    return e;
}
const Tg = (i, e)=>Br(i, (t)=>{
        let n = t.from, { state: r } = i, s = r.doc.lineAt(n), o, l;
        if (!e && n > s.from && n < s.from + 200 && !/[^ \t]/.test(o = s.text.slice(0, n - s.from))) {
            if (o[o.length - 1] == "	") return n - 1;
            let a = Ar(o, r.tabSize), c = a % Ys(r) || Ys(r);
            for(let h = 0; h < c && o[o.length - 1 - h] == " "; h++)n--;
            l = n;
        } else l = Xe(s.text, n - s.from, e, e) + s.from, l == n && s.number != (e ? r.doc.lines : 1) && (l += e ? 1 : -1);
        return l;
    }), ra = (i)=>Tg(i, !1), xg = (i)=>Tg(i, !0), Rg = (i, e)=>Br(i, (t)=>{
        let n = t.head, { state: r } = i, s = r.doc.lineAt(n), o = r.charCategorizer(n);
        for(let l = null;;){
            if (n == (e ? s.to : s.from)) {
                n == t.head && s.number != (e ? r.doc.lines : 1) && (n += e ? 1 : -1);
                break;
            }
            let a = Xe(s.text, n - s.from, e) + s.from, c = s.text.slice(Math.min(n, a) - s.from, Math.max(n, a) - s.from), h = o(c);
            if (l != null && h != l) break;
            (c != " " || n != t.head) && (l = h), n = a;
        }
        return n;
    }), Og = (i)=>Rg(i, !1), Hv = (i)=>Rg(i, !0), Wv = (i)=>Br(i, (e)=>{
        let t = i.lineBlockAt(e.head).to;
        return e.head < t ? t : Math.min(i.state.doc.length, e.head + 1);
    }), Vv = (i)=>Br(i, (e)=>{
        let t = i.moveToLineBoundary(e, !1).head;
        return e.head > t ? t : Math.max(0, e.head - 1);
    }), $v = (i)=>Br(i, (e)=>{
        let t = i.moveToLineBoundary(e, !0).head;
        return e.head < t ? t : Math.min(i.state.doc.length, e.head + 1);
    }), zv = ({ state: i, dispatch: e })=>{
    if (i.readOnly) return !1;
    let t = i.changeByRange((n)=>({
            changes: {
                from: n.from,
                to: n.to,
                insert: X.of([
                    "",
                    ""
                ])
            },
            range: O.cursor(n.from)
        }));
    return e(i.update(t, {
        scrollIntoView: !0,
        userEvent: "input"
    })), !0;
}, Uv = ({ state: i, dispatch: e })=>{
    if (i.readOnly) return !1;
    let t = i.changeByRange((n)=>{
        if (!n.empty || n.from == 0 || n.from == i.doc.length) return {
            range: n
        };
        let r = n.from, s = i.doc.lineAt(r), o = r == s.from ? r - 1 : Xe(s.text, r - s.from, !1) + s.from, l = r == s.to ? r + 1 : Xe(s.text, r - s.from, !0) + s.from;
        return {
            changes: {
                from: o,
                to: l,
                insert: i.doc.slice(r, l).append(i.doc.slice(o, r))
            },
            range: O.cursor(l)
        };
    });
    return t.changes.empty ? !1 : (e(i.update(t, {
        scrollIntoView: !0,
        userEvent: "move.character"
    })), !0);
};
function Po(i) {
    let e = [], t = -1;
    for (let n of i.selection.ranges){
        let r = i.doc.lineAt(n.from), s = i.doc.lineAt(n.to);
        if (!n.empty && n.to == s.from && (s = i.doc.lineAt(n.to - 1)), t >= r.number) {
            let o = e[e.length - 1];
            o.to = s.to, o.ranges.push(n);
        } else e.push({
            from: r.from,
            to: s.to,
            ranges: [
                n
            ]
        });
        t = s.number + 1;
    }
    return e;
}
function Dg(i, e, t) {
    if (i.readOnly) return !1;
    let n = [], r = [];
    for (let s of Po(i)){
        if (t ? s.to == i.doc.length : s.from == 0) continue;
        let o = i.doc.lineAt(t ? s.to + 1 : s.from - 1), l = o.length + 1;
        if (t) {
            n.push({
                from: s.to,
                to: o.to
            }, {
                from: s.from,
                insert: o.text + i.lineBreak
            });
            for (let a of s.ranges)r.push(O.range(Math.min(i.doc.length, a.anchor + l), Math.min(i.doc.length, a.head + l)));
        } else {
            n.push({
                from: o.from,
                to: s.from
            }, {
                from: s.to,
                insert: i.lineBreak + o.text
            });
            for (let a of s.ranges)r.push(O.range(a.anchor - l, a.head - l));
        }
    }
    return n.length ? (e(i.update({
        changes: n,
        scrollIntoView: !0,
        selection: O.create(r, i.selection.mainIndex),
        userEvent: "move.line"
    })), !0) : !1;
}
const Kv = ({ state: i, dispatch: e })=>Dg(i, e, !1), Gv = ({ state: i, dispatch: e })=>Dg(i, e, !0);
function Pg(i, e, t) {
    if (i.readOnly) return !1;
    let n = [];
    for (let r of Po(i))t ? n.push({
        from: r.from,
        insert: i.doc.slice(r.from, r.to) + i.lineBreak
    }) : n.push({
        from: r.to,
        insert: i.lineBreak + i.doc.slice(r.from, r.to)
    });
    return e(i.update({
        changes: n,
        scrollIntoView: !0,
        userEvent: "input.copyline"
    })), !0;
}
const Jv = ({ state: i, dispatch: e })=>Pg(i, e, !1), Qv = ({ state: i, dispatch: e })=>Pg(i, e, !0), Yv = (i)=>{
    if (i.state.readOnly) return !1;
    let { state: e } = i, t = e.changes(Po(e).map(({ from: r, to: s })=>(r > 0 ? r-- : s < e.doc.length && s++, {
            from: r,
            to: s
        }))), n = Nn(e.selection, (r)=>i.moveVertically(r, !0)).map(t);
    return i.dispatch({
        changes: t,
        selection: n,
        scrollIntoView: !0,
        userEvent: "delete.line"
    }), !0;
};
function Xv(i, e) {
    if (/\(\)|\[\]|\{\}/.test(i.sliceDoc(e - 1, e + 1))) return {
        from: e,
        to: e
    };
    let t = tt(i).resolveInner(e), n = t.childBefore(e), r = t.childAfter(e), s;
    return n && r && n.to <= e && r.from >= e && (s = n.type.prop(Q.closedBy)) && s.indexOf(r.name) > -1 && i.doc.lineAt(n.to).from == i.doc.lineAt(r.from).from && !/\S/.test(i.sliceDoc(n.to, r.from)) ? {
        from: n.to,
        to: r.from
    } : null;
}
const Zv = Mg(!1), ew = Mg(!0);
function Mg(i) {
    return ({ state: e, dispatch: t })=>{
        if (e.readOnly) return !1;
        let n = e.changeByRange((r)=>{
            let { from: s, to: o } = r, l = e.doc.lineAt(s), a = !i && s == o && Xv(e, s);
            i && (s = o = (o <= l.to ? l : e.doc.lineAt(o)).to);
            let c = new xo(e, {
                simulateBreak: s,
                simulateDoubleBreak: !!a
            }), h = Up(c, s);
            for(h == null && (h = Ar(/^\s*/.exec(e.doc.lineAt(s).text)[0], e.tabSize)); o < l.to && /\s/.test(l.text[o - l.from]);)o++;
            a ? { from: s, to: o } = a : s > l.from && s < l.from + 100 && !/\S/.test(l.text.slice(0, s)) && (s = l.from);
            let u = [
                "",
                Xs(e, h)
            ];
            return a && u.push(Xs(e, c.lineIndent(l.from, -1))), {
                changes: {
                    from: s,
                    to: o,
                    insert: X.of(u)
                },
                range: O.cursor(s + 1 + u[1].length)
            };
        });
        return t(e.update(n, {
            scrollIntoView: !0,
            userEvent: "input"
        })), !0;
    };
}
function Mc(i, e) {
    let t = -1;
    return i.changeByRange((n)=>{
        let r = [];
        for(let o = n.from; o <= n.to;){
            let l = i.doc.lineAt(o);
            l.number > t && (n.empty || n.to > l.from) && (e(l, r, n), t = l.number), o = l.to + 1;
        }
        let s = i.changes(r);
        return {
            changes: r,
            range: O.range(s.mapPos(n.anchor, 1), s.mapPos(n.head, 1))
        };
    });
}
const tw = ({ state: i, dispatch: e })=>{
    if (i.readOnly) return !1;
    let t = Object.create(null), n = new xo(i, {
        overrideIndentation: (s)=>{
            let o = t[s];
            return o ?? -1;
        }
    }), r = Mc(i, (s, o, l)=>{
        let a = Up(n, s.from);
        if (a == null) return;
        /\S/.test(s.text) || (a = 0);
        let c = /^\s*/.exec(s.text)[0], h = Xs(i, a);
        (c != h || l.from < s.from + c.length) && (t[s.from] = a, o.push({
            from: s.from,
            to: s.from + c.length,
            insert: h
        }));
    });
    return r.changes.empty || e(i.update(r, {
        userEvent: "indent"
    })), !0;
}, Ag = ({ state: i, dispatch: e })=>i.readOnly ? !1 : (e(i.update(Mc(i, (t, n)=>{
        n.push({
            from: t.from,
            insert: i.facet(Tc)
        });
    }), {
        userEvent: "input.indent"
    })), !0), _g = ({ state: i, dispatch: e })=>i.readOnly ? !1 : (e(i.update(Mc(i, (t, n)=>{
        let r = /^\s*/.exec(t.text)[0];
        if (!r) return;
        let s = Ar(r, i.tabSize), o = 0, l = Xs(i, Math.max(0, s - Ys(i)));
        for(; o < r.length && o < l.length && r.charCodeAt(o) == l.charCodeAt(o);)o++;
        n.push({
            from: t.from + o,
            to: t.from + r.length,
            insert: l.slice(o)
        });
    }), {
        userEvent: "delete.dedent"
    })), !0), iw = ({ state: i, dispatch: e })=>i.selection.ranges.some((t)=>!t.empty) ? Ag({
        state: i,
        dispatch: e
    }) : (e(i.update(i.replaceSelection("	"), {
        scrollIntoView: !0,
        userEvent: "input"
    })), !0), nw = [
    {
        key: "Ctrl-b",
        run: ag,
        shift: yg,
        preventDefault: !0
    },
    {
        key: "Ctrl-f",
        run: cg,
        shift: bg
    },
    {
        key: "Ctrl-p",
        run: fg,
        shift: kg
    },
    {
        key: "Ctrl-n",
        run: dg,
        shift: Sg
    },
    {
        key: "Ctrl-a",
        run: Cv,
        shift: Lv
    },
    {
        key: "Ctrl-e",
        run: Tv,
        shift: Bv
    },
    {
        key: "Ctrl-d",
        run: xg
    },
    {
        key: "Ctrl-h",
        run: ra
    },
    {
        key: "Ctrl-k",
        run: Wv
    },
    {
        key: "Ctrl-Alt-h",
        run: Og
    },
    {
        key: "Ctrl-o",
        run: zv
    },
    {
        key: "Ctrl-t",
        run: Uv
    },
    {
        key: "Ctrl-v",
        run: na
    }
], rw = [
    {
        key: "ArrowLeft",
        run: ag,
        shift: yg,
        preventDefault: !0
    },
    {
        key: "Mod-ArrowLeft",
        mac: "Alt-ArrowLeft",
        run: pv,
        shift: Ov,
        preventDefault: !0
    },
    {
        mac: "Cmd-ArrowLeft",
        run: kv,
        shift: Ev,
        preventDefault: !0
    },
    {
        key: "ArrowRight",
        run: cg,
        shift: bg,
        preventDefault: !0
    },
    {
        key: "Mod-ArrowRight",
        mac: "Alt-ArrowRight",
        run: gv,
        shift: Dv,
        preventDefault: !0
    },
    {
        mac: "Cmd-ArrowRight",
        run: Sv,
        shift: Nv,
        preventDefault: !0
    },
    {
        key: "ArrowUp",
        run: fg,
        shift: kg,
        preventDefault: !0
    },
    {
        mac: "Cmd-ArrowUp",
        run: cu,
        shift: uu
    },
    {
        mac: "Ctrl-ArrowUp",
        run: ou,
        shift: lu
    },
    {
        key: "ArrowDown",
        run: dg,
        shift: Sg,
        preventDefault: !0
    },
    {
        mac: "Cmd-ArrowDown",
        run: hu,
        shift: fu
    },
    {
        mac: "Ctrl-ArrowDown",
        run: na,
        shift: au
    },
    {
        key: "PageUp",
        run: ou,
        shift: lu
    },
    {
        key: "PageDown",
        run: na,
        shift: au
    },
    {
        key: "Home",
        run: wv,
        shift: _v,
        preventDefault: !0
    },
    {
        key: "Mod-Home",
        run: cu,
        shift: uu
    },
    {
        key: "End",
        run: vv,
        shift: Av,
        preventDefault: !0
    },
    {
        key: "Mod-End",
        run: hu,
        shift: fu
    },
    {
        key: "Enter",
        run: Zv
    },
    {
        key: "Mod-a",
        run: Iv
    },
    {
        key: "Backspace",
        run: ra,
        shift: ra
    },
    {
        key: "Delete",
        run: xg
    },
    {
        key: "Mod-Backspace",
        mac: "Alt-Backspace",
        run: Og
    },
    {
        key: "Mod-Delete",
        mac: "Alt-Delete",
        run: Hv
    },
    {
        mac: "Mod-Backspace",
        run: Vv
    },
    {
        mac: "Mod-Delete",
        run: $v
    }
].concat(nw.map((i)=>({
        mac: i.key,
        run: i.run,
        shift: i.shift
    }))), sw = [
    {
        key: "Alt-ArrowLeft",
        mac: "Ctrl-ArrowLeft",
        run: yv,
        shift: Pv
    },
    {
        key: "Alt-ArrowRight",
        mac: "Ctrl-ArrowRight",
        run: bv,
        shift: Mv
    },
    {
        key: "Alt-ArrowUp",
        run: Kv
    },
    {
        key: "Shift-Alt-ArrowUp",
        run: Jv
    },
    {
        key: "Alt-ArrowDown",
        run: Gv
    },
    {
        key: "Shift-Alt-ArrowDown",
        run: Qv
    },
    {
        key: "Escape",
        run: Fv
    },
    {
        key: "Mod-Enter",
        run: ew
    },
    {
        key: "Alt-l",
        mac: "Ctrl-l",
        run: qv
    },
    {
        key: "Mod-i",
        run: jv,
        preventDefault: !0
    },
    {
        key: "Mod-[",
        run: _g
    },
    {
        key: "Mod-]",
        run: Ag
    },
    {
        key: "Mod-Alt-\\",
        run: tw
    },
    {
        key: "Shift-Mod-k",
        run: Yv
    },
    {
        key: "Shift-Mod-\\",
        run: Rv
    },
    {
        key: "Mod-/",
        run: Gb
    },
    {
        key: "Alt-A",
        run: Qb
    }
].concat(rw);
function qt() {
    var i = arguments[0];
    typeof i == "string" && (i = document.createElement(i));
    var e = 1, t = arguments[1];
    if (t && typeof t == "object" && t.nodeType == null && !Array.isArray(t)) {
        for(var n in t)if (Object.prototype.hasOwnProperty.call(t, n)) {
            var r = t[n];
            typeof r == "string" ? i.setAttribute(n, r) : r != null && (i[n] = r);
        }
        e++;
    }
    for(; e < arguments.length; e++)Eg(i, arguments[e]);
    return i;
}
function Eg(i, e) {
    if (typeof e == "string") i.appendChild(document.createTextNode(e));
    else if (e != null) {
        if (e.nodeType != null) i.appendChild(e);
        else if (Array.isArray(e)) for(var t = 0; t < e.length; t++)Eg(i, e[t]);
        else throw new RangeError("Unsupported child node: " + e);
    }
}
class Ng {
    constructor(e, t, n){
        this.state = e, this.pos = t, this.explicit = n, this.abortListeners = [];
    }
    tokenBefore(e) {
        let t = tt(this.state).resolveInner(this.pos, -1);
        for(; t && e.indexOf(t.name) < 0;)t = t.parent;
        return t ? {
            from: t.from,
            to: this.pos,
            text: this.state.sliceDoc(t.from, this.pos),
            type: t.type
        } : null;
    }
    matchBefore(e) {
        let t = this.state.doc.lineAt(this.pos), n = Math.max(t.from, this.pos - 250), r = t.text.slice(n - t.from, this.pos - t.from), s = r.search(Lg(e, !1));
        return s < 0 ? null : {
            from: n + s,
            to: this.pos,
            text: r.slice(s)
        };
    }
    get aborted() {
        return this.abortListeners == null;
    }
    addEventListener(e, t) {
        e == "abort" && this.abortListeners && this.abortListeners.push(t);
    }
}
function du(i) {
    let e = Object.keys(i).join(""), t = /\w/.test(e);
    return t && (e = e.replace(/\w/g, "")), `[${t ? "\\w" : ""}${e.replace(/[^\w\s]/g, "\\$&")}]`;
}
function ow(i) {
    let e = Object.create(null), t = Object.create(null);
    for (let { label: r } of i){
        e[r[0]] = !0;
        for(let s = 1; s < r.length; s++)t[r[s]] = !0;
    }
    let n = du(e) + du(t) + "*$";
    return [
        new RegExp("^" + n),
        new RegExp(n)
    ];
}
function lw(i) {
    let e = i.map((r)=>typeof r == "string" ? {
            label: r
        } : r), [t, n] = e.every((r)=>/^\w+$/.test(r.label)) ? [
        /\w*$/,
        /\w+$/
    ] : ow(e);
    return (r)=>{
        let s = r.matchBefore(n);
        return s || r.explicit ? {
            from: s ? s.from : r.pos,
            options: e,
            validFor: t
        } : null;
    };
}
class pu {
    constructor(e, t, n, r){
        this.completion = e, this.source = t, this.match = n, this.score = r;
    }
}
function vi(i) {
    return i.selection.main.from;
}
function Lg(i, e) {
    var t;
    let { source: n } = i, r = e && n[0] != "^", s = n[n.length - 1] != "$";
    return !r && !s ? i : new RegExp(`${r ? "^" : ""}(?:${n})${s ? "$" : ""}`, (t = i.flags) !== null && t !== void 0 ? t : i.ignoreCase ? "i" : "");
}
const aw = oi.define();
function cw(i, e, t, n) {
    let { main: r } = i.selection, s = t - r.from, o = n - r.from;
    return Object.assign(Object.assign({}, i.changeByRange((l)=>l != r && t != n && i.sliceDoc(l.from + s, l.from + o) != i.sliceDoc(t, n) ? {
            range: l
        } : {
            changes: {
                from: l.from + s,
                to: n == r.from ? l.to : l.from + o,
                insert: e
            },
            range: O.cursor(l.from + s + e.length)
        })), {
        scrollIntoView: !0,
        userEvent: "input.complete"
    });
}
const gu = new WeakMap;
function hw(i) {
    if (!Array.isArray(i)) return i;
    let e = gu.get(i);
    return e || gu.set(i, e = lw(i)), e;
}
const Ac = Z.define(), wr = Z.define();
class uw {
    constructor(e){
        this.pattern = e, this.chars = [], this.folded = [], this.any = [], this.precise = [], this.byWord = [], this.score = 0, this.matched = [];
        for(let t = 0; t < e.length;){
            let n = wt(e, t), r = fi(n);
            this.chars.push(n);
            let s = e.slice(t, t + r), o = s.toUpperCase();
            this.folded.push(wt(o == s ? s.toLowerCase() : o, 0)), t += r;
        }
        this.astral = e.length != this.chars.length;
    }
    ret(e, t) {
        return this.score = e, this.matched = t, !0;
    }
    match(e) {
        if (this.pattern.length == 0) return this.ret(-100, []);
        if (e.length < this.pattern.length) return !1;
        let { chars: t, folded: n, any: r, precise: s, byWord: o } = this;
        if (t.length == 1) {
            let T = wt(e, 0), D = fi(T), S = D == e.length ? 0 : -100;
            if (T != t[0]) {
                if (T == n[0]) S += -200;
                else return !1;
            }
            return this.ret(S, [
                0,
                D
            ]);
        }
        let l = e.indexOf(this.pattern);
        if (l == 0) return this.ret(e.length == this.pattern.length ? 0 : -100, [
            0,
            this.pattern.length
        ]);
        let a = t.length, c = 0;
        if (l < 0) {
            for(let T = 0, D = Math.min(e.length, 200); T < D && c < a;){
                let S = wt(e, T);
                (S == t[c] || S == n[c]) && (r[c++] = T), T += fi(S);
            }
            if (c < a) return !1;
        }
        let h = 0, u = 0, f = !1, d = 0, p = -1, y = -1, b = /[a-z]/.test(e), k = !0;
        for(let T = 0, D = Math.min(e.length, 200), S = 0; T < D && u < a;){
            let x = wt(e, T);
            l < 0 && (h < a && x == t[h] && (s[h++] = T), d < a && (x == t[d] || x == n[d] ? (d == 0 && (p = T), y = T + 1, d++) : d = 0));
            let R, E = x < 255 ? x >= 48 && x <= 57 || x >= 97 && x <= 122 ? 2 : x >= 65 && x <= 90 ? 1 : 0 : (R = Cm(x)) != R.toLowerCase() ? 1 : R != R.toUpperCase() ? 2 : 0;
            (!T || E == 1 && b || S == 0 && E != 0) && (t[u] == x || n[u] == x && (f = !0) ? o[u++] = T : o.length && (k = !1)), S = E, T += fi(x);
        }
        return u == a && o[0] == 0 && k ? this.result(-100 + (f ? -200 : 0), o, e) : d == a && p == 0 ? this.ret(-200 - e.length + (y == e.length ? 0 : -100), [
            0,
            y
        ]) : l > -1 ? this.ret(-700 - e.length, [
            l,
            l + this.pattern.length
        ]) : d == a ? this.ret(-900 - e.length, [
            p,
            y
        ]) : u == a ? this.result(-100 + (f ? -200 : 0) + -700 + (k ? 0 : -1100), o, e) : t.length == 2 ? !1 : this.result((r[0] ? -700 : 0) + -200 + -1100, r, e);
    }
    result(e, t, n) {
        let r = [], s = 0;
        for (let o of t){
            let l = o + (this.astral ? fi(wt(n, o)) : 1);
            s && r[s - 1] == o ? r[s - 1] = l : (r[s++] = o, r[s++] = l);
        }
        return this.ret(e - n.length, r);
    }
}
const We = q.define({
    combine (i) {
        return En(i, {
            activateOnTyping: !0,
            selectOnOpen: !0,
            override: null,
            closeOnBlur: !0,
            maxRenderedOptions: 100,
            defaultKeymap: !0,
            tooltipClass: ()=>"",
            optionClass: ()=>"",
            aboveCursor: !1,
            icons: !0,
            addToOptions: [],
            positionInfo: fw,
            compareCompletions: (e, t)=>e.label.localeCompare(t.label),
            interactionDelay: 75,
            updateSyncTime: 100
        }, {
            defaultKeymap: (e, t)=>e && t,
            closeOnBlur: (e, t)=>e && t,
            icons: (e, t)=>e && t,
            tooltipClass: (e, t)=>(n)=>mu(e(n), t(n)),
            optionClass: (e, t)=>(n)=>mu(e(n), t(n)),
            addToOptions: (e, t)=>e.concat(t)
        });
    }
});
function mu(i, e) {
    return i ? e ? i + " " + e : i : e;
}
function fw(i, e, t, n, r, s) {
    let o = i.textDirection == ge.RTL, l = o, a = !1, c = "top", h, u, f = e.left - r.left, d = r.right - e.right, p = n.right - n.left, y = n.bottom - n.top;
    if (l && f < Math.min(p, d) ? l = !1 : !l && d < Math.min(p, f) && (l = !0), p <= (l ? f : d)) h = Math.max(r.top, Math.min(t.top, r.bottom - y)) - e.top, u = Math.min(400, l ? f : d);
    else {
        a = !0, u = Math.min(400, (o ? e.right : r.right - e.left) - 30);
        let T = r.bottom - e.bottom;
        T >= y || T > e.top ? h = t.bottom - e.top : (c = "bottom", h = e.bottom - t.top);
    }
    let b = (e.bottom - e.top) / s.offsetHeight, k = (e.right - e.left) / s.offsetWidth;
    return {
        style: `${c}: ${h / b}px; max-width: ${u / k}px`,
        class: "cm-completionInfo-" + (a ? o ? "left-narrow" : "right-narrow" : l ? "left" : "right")
    };
}
function dw(i) {
    let e = i.addToOptions.slice();
    return i.icons && e.push({
        render (t) {
            let n = document.createElement("div");
            return n.classList.add("cm-completionIcon"), t.type && n.classList.add(...t.type.split(/\s+/g).map((r)=>"cm-completionIcon-" + r)), n.setAttribute("aria-hidden", "true"), n;
        },
        position: 20
    }), e.push({
        render (t, n, r) {
            let s = document.createElement("span");
            s.className = "cm-completionLabel";
            let o = t.displayLabel || t.label, l = 0;
            for(let a = 0; a < r.length;){
                let c = r[a++], h = r[a++];
                c > l && s.appendChild(document.createTextNode(o.slice(l, c)));
                let u = s.appendChild(document.createElement("span"));
                u.appendChild(document.createTextNode(o.slice(c, h))), u.className = "cm-completionMatchedText", l = h;
            }
            return l < o.length && s.appendChild(document.createTextNode(o.slice(l))), s;
        },
        position: 50
    }, {
        render (t) {
            if (!t.detail) return null;
            let n = document.createElement("span");
            return n.className = "cm-completionDetail", n.textContent = t.detail, n;
        },
        position: 80
    }), e.sort((t, n)=>t.position - n.position).map((t)=>t.render);
}
function ll(i, e, t) {
    if (i <= t) return {
        from: 0,
        to: i
    };
    if (e < 0 && (e = 0), e <= i >> 1) {
        let r = Math.floor(e / t);
        return {
            from: r * t,
            to: (r + 1) * t
        };
    }
    let n = Math.floor((i - e) / t);
    return {
        from: i - (n + 1) * t,
        to: i - n * t
    };
}
class pw {
    constructor(e, t, n){
        this.view = e, this.stateField = t, this.applyCompletion = n, this.info = null, this.infoDestroy = null, this.placeInfoReq = {
            read: ()=>this.measureInfo(),
            write: (a)=>this.placeInfo(a),
            key: this
        }, this.space = null, this.currentClass = "";
        let r = e.state.field(t), { options: s, selected: o } = r.open, l = e.state.facet(We);
        this.optionContent = dw(l), this.optionClass = l.optionClass, this.tooltipClass = l.tooltipClass, this.range = ll(s.length, o, l.maxRenderedOptions), this.dom = document.createElement("div"), this.dom.className = "cm-tooltip-autocomplete", this.updateTooltipClass(e.state), this.dom.addEventListener("mousedown", (a)=>{
            let { options: c } = e.state.field(t).open;
            for(let h = a.target, u; h && h != this.dom; h = h.parentNode)if (h.nodeName == "LI" && (u = /-(\d+)$/.exec(h.id)) && +u[1] < c.length) {
                this.applyCompletion(e, c[+u[1]]), a.preventDefault();
                return;
            }
        }), this.dom.addEventListener("focusout", (a)=>{
            let c = e.state.field(this.stateField, !1);
            c && c.tooltip && e.state.facet(We).closeOnBlur && a.relatedTarget != e.contentDOM && e.dispatch({
                effects: wr.of(null)
            });
        }), this.showOptions(s, r.id);
    }
    mount() {
        this.updateSel();
    }
    showOptions(e, t) {
        this.list && this.list.remove(), this.list = this.dom.appendChild(this.createListBox(e, t, this.range)), this.list.addEventListener("scroll", ()=>{
            this.info && this.view.requestMeasure(this.placeInfoReq);
        });
    }
    update(e) {
        var t;
        let n = e.state.field(this.stateField), r = e.startState.field(this.stateField);
        if (this.updateTooltipClass(e.state), n != r) {
            let { options: s, selected: o, disabled: l } = n.open;
            (!r.open || r.open.options != s) && (this.range = ll(s.length, o, e.state.facet(We).maxRenderedOptions), this.showOptions(s, n.id)), this.updateSel(), l != ((t = r.open) === null || t === void 0 ? void 0 : t.disabled) && this.dom.classList.toggle("cm-tooltip-autocomplete-disabled", !!l);
        }
    }
    updateTooltipClass(e) {
        let t = this.tooltipClass(e);
        if (t != this.currentClass) {
            for (let n of this.currentClass.split(" "))n && this.dom.classList.remove(n);
            for (let n of t.split(" "))n && this.dom.classList.add(n);
            this.currentClass = t;
        }
    }
    positioned(e) {
        this.space = e, this.info && this.view.requestMeasure(this.placeInfoReq);
    }
    updateSel() {
        let e = this.view.state.field(this.stateField), t = e.open;
        if ((t.selected > -1 && t.selected < this.range.from || t.selected >= this.range.to) && (this.range = ll(t.options.length, t.selected, this.view.state.facet(We).maxRenderedOptions), this.showOptions(t.options, e.id)), this.updateSelectedOption(t.selected)) {
            this.destroyInfo();
            let { completion: n } = t.options[t.selected], { info: r } = n;
            if (!r) return;
            let s = typeof r == "string" ? document.createTextNode(r) : r(n);
            if (!s) return;
            "then" in s ? s.then((o)=>{
                o && this.view.state.field(this.stateField, !1) == e && this.addInfoPane(o, n);
            }).catch((o)=>Tt(this.view.state, o, "completion info")) : this.addInfoPane(s, n);
        }
    }
    addInfoPane(e, t) {
        this.destroyInfo();
        let n = this.info = document.createElement("div");
        if (n.className = "cm-tooltip cm-completionInfo", e.nodeType != null) n.appendChild(e), this.infoDestroy = null;
        else {
            let { dom: r, destroy: s } = e;
            n.appendChild(r), this.infoDestroy = s || null;
        }
        this.dom.appendChild(n), this.view.requestMeasure(this.placeInfoReq);
    }
    updateSelectedOption(e) {
        let t = null;
        for(let n = this.list.firstChild, r = this.range.from; n; n = n.nextSibling, r++)n.nodeName != "LI" || !n.id ? r-- : r == e ? n.hasAttribute("aria-selected") || (n.setAttribute("aria-selected", "true"), t = n) : n.hasAttribute("aria-selected") && n.removeAttribute("aria-selected");
        return t && mw(this.list, t), t;
    }
    measureInfo() {
        let e = this.dom.querySelector("[aria-selected]");
        if (!e || !this.info) return null;
        let t = this.dom.getBoundingClientRect(), n = this.info.getBoundingClientRect(), r = e.getBoundingClientRect(), s = this.space;
        if (!s) {
            let o = this.dom.ownerDocument.defaultView || window;
            s = {
                left: 0,
                top: 0,
                right: o.innerWidth,
                bottom: o.innerHeight
            };
        }
        return r.top > Math.min(s.bottom, t.bottom) - 10 || r.bottom < Math.max(s.top, t.top) + 10 ? null : this.view.state.facet(We).positionInfo(this.view, t, r, n, s, this.dom);
    }
    placeInfo(e) {
        this.info && (e ? (e.style && (this.info.style.cssText = e.style), this.info.className = "cm-tooltip cm-completionInfo " + (e.class || "")) : this.info.style.cssText = "top: -1e6px");
    }
    createListBox(e, t, n) {
        const r = document.createElement("ul");
        r.id = t, r.setAttribute("role", "listbox"), r.setAttribute("aria-expanded", "true"), r.setAttribute("aria-label", this.view.state.phrase("Completions"));
        let s = null;
        for(let o = n.from; o < n.to; o++){
            let { completion: l, match: a } = e[o], { section: c } = l;
            if (c) {
                let f = typeof c == "string" ? c : c.name;
                if (f != s && (o > n.from || n.from == 0)) {
                    if (s = f, typeof c != "string" && c.header) r.appendChild(c.header(c));
                    else {
                        let d = r.appendChild(document.createElement("completion-section"));
                        d.textContent = f;
                    }
                }
            }
            const h = r.appendChild(document.createElement("li"));
            h.id = t + "-" + o, h.setAttribute("role", "option");
            let u = this.optionClass(l);
            u && (h.className = u);
            for (let f of this.optionContent){
                let d = f(l, this.view.state, a);
                d && h.appendChild(d);
            }
        }
        return n.from && r.classList.add("cm-completionListIncompleteTop"), n.to < e.length && r.classList.add("cm-completionListIncompleteBottom"), r;
    }
    destroyInfo() {
        this.info && (this.infoDestroy && this.infoDestroy(), this.info.remove(), this.info = null);
    }
    destroy() {
        this.destroyInfo();
    }
}
function gw(i, e) {
    return (t)=>new pw(t, i, e);
}
function mw(i, e) {
    let t = i.getBoundingClientRect(), n = e.getBoundingClientRect(), r = t.height / i.offsetHeight;
    n.top < t.top ? i.scrollTop -= (t.top - n.top) / r : n.bottom > t.bottom && (i.scrollTop += (n.bottom - t.bottom) / r);
}
function yu(i) {
    return (i.boost || 0) * 100 + (i.apply ? 10 : 0) + (i.info ? 5 : 0) + (i.type ? 1 : 0);
}
function yw(i, e) {
    let t = [], n = null, r = (a)=>{
        t.push(a);
        let { section: c } = a.completion;
        if (c) {
            n || (n = []);
            let h = typeof c == "string" ? c : c.name;
            n.some((u)=>u.name == h) || n.push(typeof c == "string" ? {
                name: h
            } : c);
        }
    };
    for (let a of i)if (a.hasResult()) {
        let c = a.result.getMatch;
        if (a.result.filter === !1) for (let h of a.result.options)r(new pu(h, a.source, c ? c(h) : [], 1e9 - t.length));
        else {
            let h = new uw(e.sliceDoc(a.from, a.to));
            for (let u of a.result.options)if (h.match(u.label)) {
                let f = u.displayLabel ? c ? c(u, h.matched) : [] : h.matched;
                r(new pu(u, a.source, f, h.score + (u.boost || 0)));
            }
        }
    }
    if (n) {
        let a = Object.create(null), c = 0, h = (u, f)=>{
            var d, p;
            return ((d = u.rank) !== null && d !== void 0 ? d : 1e9) - ((p = f.rank) !== null && p !== void 0 ? p : 1e9) || (u.name < f.name ? -1 : 1);
        };
        for (let u of n.sort(h))c -= 1e5, a[u.name] = c;
        for (let u of t){
            let { section: f } = u.completion;
            f && (u.score += a[typeof f == "string" ? f : f.name]);
        }
    }
    let s = [], o = null, l = e.facet(We).compareCompletions;
    for (let a of t.sort((c, h)=>h.score - c.score || l(c.completion, h.completion))){
        let c = a.completion;
        !o || o.label != c.label || o.detail != c.detail || o.type != null && c.type != null && o.type != c.type || o.apply != c.apply || o.boost != c.boost ? s.push(a) : yu(a.completion) > yu(o) && (s[s.length - 1] = a), o = a.completion;
    }
    return s;
}
class an {
    constructor(e, t, n, r, s, o){
        this.options = e, this.attrs = t, this.tooltip = n, this.timestamp = r, this.selected = s, this.disabled = o;
    }
    setSelected(e, t) {
        return e == this.selected || e >= this.options.length ? this : new an(this.options, bu(t, e), this.tooltip, this.timestamp, e, this.disabled);
    }
    static build(e, t, n, r, s) {
        let o = yw(e, t);
        if (!o.length) return r && e.some((a)=>a.state == 1) ? new an(r.options, r.attrs, r.tooltip, r.timestamp, r.selected, !0) : null;
        let l = t.facet(We).selectOnOpen ? 0 : -1;
        if (r && r.selected != l && r.selected != -1) {
            let a = r.options[r.selected].completion;
            for(let c = 0; c < o.length; c++)if (o[c].completion == a) {
                l = c;
                break;
            }
        }
        return new an(o, bu(n, l), {
            pos: e.reduce((a, c)=>c.hasResult() ? Math.min(a, c.from) : a, 1e8),
            create: Sw,
            above: s.aboveCursor
        }, r ? r.timestamp : Date.now(), l, !1);
    }
    map(e) {
        return new an(this.options, this.attrs, Object.assign(Object.assign({}, this.tooltip), {
            pos: e.mapPos(this.tooltip.pos)
        }), this.timestamp, this.selected, this.disabled);
    }
}
class to {
    constructor(e, t, n){
        this.active = e, this.id = t, this.open = n;
    }
    static start() {
        return new to(ww, "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36), null);
    }
    update(e) {
        let { state: t } = e, n = t.facet(We), s = (n.override || t.languageDataAt("autocomplete", vi(t)).map(hw)).map((l)=>(this.active.find((c)=>c.source == l) || new Je(l, this.active.some((c)=>c.state != 0) ? 1 : 0)).update(e, n));
        s.length == this.active.length && s.every((l, a)=>l == this.active[a]) && (s = this.active);
        let o = this.open;
        o && e.docChanged && (o = o.map(e.changes)), e.selection || s.some((l)=>l.hasResult() && e.changes.touchesRange(l.from, l.to)) || !bw(s, this.active) ? o = an.build(s, t, this.id, o, n) : o && o.disabled && !s.some((l)=>l.state == 1) && (o = null), !o && s.every((l)=>l.state != 1) && s.some((l)=>l.hasResult()) && (s = s.map((l)=>l.hasResult() ? new Je(l.source, 0) : l));
        for (let l of e.effects)l.is(Ig) && (o = o && o.setSelected(l.value, this.id));
        return s == this.active && o == this.open ? this : new to(s, this.id, o);
    }
    get tooltip() {
        return this.open ? this.open.tooltip : null;
    }
    get attrs() {
        return this.open ? this.open.attrs : vw;
    }
}
function bw(i, e) {
    if (i == e) return !0;
    for(let t = 0, n = 0;;){
        for(; t < i.length && !i[t].hasResult;)t++;
        for(; n < e.length && !e[n].hasResult;)n++;
        let r = t == i.length, s = n == e.length;
        if (r || s) return r == s;
        if (i[t++].result != e[n++].result) return !1;
    }
}
const vw = {
    "aria-autocomplete": "list"
};
function bu(i, e) {
    let t = {
        "aria-autocomplete": "list",
        "aria-haspopup": "listbox",
        "aria-controls": i
    };
    return e > -1 && (t["aria-activedescendant"] = i + "-" + e), t;
}
const ww = [];
function sa(i) {
    return i.isUserEvent("input.type") ? "input" : i.isUserEvent("delete.backward") ? "delete" : null;
}
class Je {
    constructor(e, t, n = -1){
        this.source = e, this.state = t, this.explicitPos = n;
    }
    hasResult() {
        return !1;
    }
    update(e, t) {
        let n = sa(e), r = this;
        n ? r = r.handleUserEvent(e, n, t) : e.docChanged ? r = r.handleChange(e) : e.selection && r.state != 0 && (r = new Je(r.source, 0));
        for (let s of e.effects)if (s.is(Ac)) r = new Je(r.source, 1, s.value ? vi(e.state) : -1);
        else if (s.is(wr)) r = new Je(r.source, 0);
        else if (s.is(Bg)) for (let o of s.value)o.source == r.source && (r = o);
        return r;
    }
    handleUserEvent(e, t, n) {
        return t == "delete" || !n.activateOnTyping ? this.map(e.changes) : new Je(this.source, 1);
    }
    handleChange(e) {
        return e.changes.touchesRange(vi(e.startState)) ? new Je(this.source, 0) : this.map(e.changes);
    }
    map(e) {
        return e.empty || this.explicitPos < 0 ? this : new Je(this.source, this.state, e.mapPos(this.explicitPos));
    }
}
class fn extends Je {
    constructor(e, t, n, r, s){
        super(e, 2, t), this.result = n, this.from = r, this.to = s;
    }
    hasResult() {
        return !0;
    }
    handleUserEvent(e, t, n) {
        var r;
        let s = e.changes.mapPos(this.from), o = e.changes.mapPos(this.to, 1), l = vi(e.state);
        if ((this.explicitPos < 0 ? l <= s : l < this.from) || l > o || t == "delete" && vi(e.startState) == this.from) return new Je(this.source, t == "input" && n.activateOnTyping ? 1 : 0);
        let a = this.explicitPos < 0 ? -1 : e.changes.mapPos(this.explicitPos), c;
        return kw(this.result.validFor, e.state, s, o) ? new fn(this.source, a, this.result, s, o) : this.result.update && (c = this.result.update(this.result, s, o, new Ng(e.state, l, a >= 0))) ? new fn(this.source, a, c, c.from, (r = c.to) !== null && r !== void 0 ? r : vi(e.state)) : new Je(this.source, 1, a);
    }
    handleChange(e) {
        return e.changes.touchesRange(this.from, this.to) ? new Je(this.source, 0) : this.map(e.changes);
    }
    map(e) {
        return e.empty ? this : new fn(this.source, this.explicitPos < 0 ? -1 : e.mapPos(this.explicitPos), this.result, e.mapPos(this.from), e.mapPos(this.to, 1));
    }
}
function kw(i, e, t, n) {
    if (!i) return !1;
    let r = e.sliceDoc(t, n);
    return typeof i == "function" ? i(r, t, n, e) : Lg(i, !0).test(r);
}
const Bg = Z.define({
    map (i, e) {
        return i.map((t)=>t.map(e));
    }
}), Ig = Z.define(), rt = pt.define({
    create () {
        return to.start();
    },
    update (i, e) {
        return i.update(e);
    },
    provide: (i)=>[
            bc.from(i, (e)=>e.tooltip),
            $.contentAttributes.from(i, (e)=>e.attrs)
        ]
});
function qg(i, e) {
    const t = e.completion.apply || e.completion.label;
    let n = i.state.field(rt).active.find((r)=>r.source == e.source);
    return n instanceof fn ? (typeof t == "string" ? i.dispatch(Object.assign(Object.assign({}, cw(i.state, t, n.from, n.to)), {
        annotations: aw.of(e.completion)
    })) : t(i, e.completion, n.from, n.to), !0) : !1;
}
const Sw = gw(rt, qg);
function ks(i, e = "option") {
    return (t)=>{
        let n = t.state.field(rt, !1);
        if (!n || !n.open || n.open.disabled || Date.now() - n.open.timestamp < t.state.facet(We).interactionDelay) return !1;
        let r = 1, s;
        e == "page" && (s = Lp(t, n.open.tooltip)) && (r = Math.max(2, Math.floor(s.dom.offsetHeight / s.dom.querySelector("li").offsetHeight) - 1));
        let { length: o } = n.open.options, l = n.open.selected > -1 ? n.open.selected + r * (i ? 1 : -1) : i ? 0 : o - 1;
        return l < 0 ? l = e == "page" ? 0 : o - 1 : l >= o && (l = e == "page" ? o - 1 : 0), t.dispatch({
            effects: Ig.of(l)
        }), !0;
    };
}
const Cw = (i)=>{
    let e = i.state.field(rt, !1);
    return i.state.readOnly || !e || !e.open || e.open.selected < 0 || e.open.disabled || Date.now() - e.open.timestamp < i.state.facet(We).interactionDelay ? !1 : qg(i, e.open.options[e.open.selected]);
}, Tw = (i)=>i.state.field(rt, !1) ? (i.dispatch({
        effects: Ac.of(!0)
    }), !0) : !1, xw = (i)=>{
    let e = i.state.field(rt, !1);
    return !e || !e.active.some((t)=>t.state != 0) ? !1 : (i.dispatch({
        effects: wr.of(null)
    }), !0);
};
class Rw {
    constructor(e, t){
        this.active = e, this.context = t, this.time = Date.now(), this.updates = [], this.done = void 0;
    }
}
const Ow = 50, Dw = 1e3, Pw = Ie.fromClass(class {
    constructor(i){
        this.view = i, this.debounceUpdate = -1, this.running = [], this.debounceAccept = -1, this.composing = 0;
        for (let e of i.state.field(rt).active)e.state == 1 && this.startQuery(e);
    }
    update(i) {
        let e = i.state.field(rt);
        if (!i.selectionSet && !i.docChanged && i.startState.field(rt) == e) return;
        let t = i.transactions.some((n)=>(n.selection || n.docChanged) && !sa(n));
        for(let n = 0; n < this.running.length; n++){
            let r = this.running[n];
            if (t || r.updates.length + i.transactions.length > Ow && Date.now() - r.time > Dw) {
                for (let s of r.context.abortListeners)try {
                    s();
                } catch (o) {
                    Tt(this.view.state, o);
                }
                r.context.abortListeners = null, this.running.splice(n--, 1);
            } else r.updates.push(...i.transactions);
        }
        if (this.debounceUpdate > -1 && clearTimeout(this.debounceUpdate), this.debounceUpdate = e.active.some((n)=>n.state == 1 && !this.running.some((r)=>r.active.source == n.source)) ? setTimeout(()=>this.startUpdate(), 50) : -1, this.composing != 0) for (let n of i.transactions)sa(n) == "input" ? this.composing = 2 : this.composing == 2 && n.selection && (this.composing = 3);
    }
    startUpdate() {
        this.debounceUpdate = -1;
        let { state: i } = this.view, e = i.field(rt);
        for (let t of e.active)t.state == 1 && !this.running.some((n)=>n.active.source == t.source) && this.startQuery(t);
    }
    startQuery(i) {
        let { state: e } = this.view, t = vi(e), n = new Ng(e, t, i.explicitPos == t), r = new Rw(i, n);
        this.running.push(r), Promise.resolve(i.source(n)).then((s)=>{
            r.context.aborted || (r.done = s || null, this.scheduleAccept());
        }, (s)=>{
            this.view.dispatch({
                effects: wr.of(null)
            }), Tt(this.view.state, s);
        });
    }
    scheduleAccept() {
        this.running.every((i)=>i.done !== void 0) ? this.accept() : this.debounceAccept < 0 && (this.debounceAccept = setTimeout(()=>this.accept(), this.view.state.facet(We).updateSyncTime));
    }
    accept() {
        var i;
        this.debounceAccept > -1 && clearTimeout(this.debounceAccept), this.debounceAccept = -1;
        let e = [], t = this.view.state.facet(We);
        for(let n = 0; n < this.running.length; n++){
            let r = this.running[n];
            if (r.done === void 0) continue;
            if (this.running.splice(n--, 1), r.done) {
                let o = new fn(r.active.source, r.active.explicitPos, r.done, r.done.from, (i = r.done.to) !== null && i !== void 0 ? i : vi(r.updates.length ? r.updates[0].startState : this.view.state));
                for (let l of r.updates)o = o.update(l, t);
                if (o.hasResult()) {
                    e.push(o);
                    continue;
                }
            }
            let s = this.view.state.field(rt).active.find((o)=>o.source == r.active.source);
            if (s && s.state == 1) {
                if (r.done == null) {
                    let o = new Je(r.active.source, 0);
                    for (let l of r.updates)o = o.update(l, t);
                    o.state != 1 && e.push(o);
                } else this.startQuery(s);
            }
        }
        e.length && this.view.dispatch({
            effects: Bg.of(e)
        });
    }
}, {
    eventHandlers: {
        blur (i) {
            let e = this.view.state.field(rt, !1);
            if (e && e.tooltip && this.view.state.facet(We).closeOnBlur) {
                let t = e.open && Lp(this.view, e.open.tooltip);
                (!t || !t.dom.contains(i.relatedTarget)) && this.view.dispatch({
                    effects: wr.of(null)
                });
            }
        },
        compositionstart () {
            this.composing = 1;
        },
        compositionend () {
            this.composing == 3 && setTimeout(()=>this.view.dispatch({
                    effects: Ac.of(!1)
                }), 20), this.composing = 0;
        }
    }
}), Mw = $.baseTheme({
    ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul": {
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "hidden auto",
            maxWidth_fallback: "700px",
            maxWidth: "min(700px, 95vw)",
            minWidth: "250px",
            maxHeight: "10em",
            height: "100%",
            listStyle: "none",
            margin: 0,
            padding: 0,
            "& > li, & > completion-section": {
                padding: "1px 3px",
                lineHeight: 1.2
            },
            "& > li": {
                overflowX: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer"
            },
            "& > completion-section": {
                display: "list-item",
                borderBottom: "1px solid silver",
                paddingLeft: "0.5em",
                opacity: .7
            }
        }
    },
    "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
        background: "#17c",
        color: "white"
    },
    "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
        background: "#777"
    },
    "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
        background: "#347",
        color: "white"
    },
    "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
        background: "#444"
    },
    ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
        content: '"\xb7\xb7\xb7"',
        opacity: .5,
        display: "block",
        textAlign: "center"
    },
    ".cm-tooltip.cm-completionInfo": {
        position: "absolute",
        padding: "3px 9px",
        width: "max-content",
        maxWidth: "400px",
        boxSizing: "border-box"
    },
    ".cm-completionInfo.cm-completionInfo-left": {
        right: "100%"
    },
    ".cm-completionInfo.cm-completionInfo-right": {
        left: "100%"
    },
    ".cm-completionInfo.cm-completionInfo-left-narrow": {
        right: "30px"
    },
    ".cm-completionInfo.cm-completionInfo-right-narrow": {
        left: "30px"
    },
    "&light .cm-snippetField": {
        backgroundColor: "#00000022"
    },
    "&dark .cm-snippetField": {
        backgroundColor: "#ffffff22"
    },
    ".cm-snippetFieldPosition": {
        verticalAlign: "text-top",
        width: 0,
        height: "1.15em",
        display: "inline-block",
        margin: "0 -0.7px -.7em",
        borderLeft: "1.4px dotted #888"
    },
    ".cm-completionMatchedText": {
        textDecoration: "underline"
    },
    ".cm-completionDetail": {
        marginLeft: "0.5em",
        fontStyle: "italic"
    },
    ".cm-completionIcon": {
        fontSize: "90%",
        width: ".8em",
        display: "inline-block",
        textAlign: "center",
        paddingRight: ".6em",
        opacity: "0.6",
        boxSizing: "content-box"
    },
    ".cm-completionIcon-function, .cm-completionIcon-method": {
        "&:after": {
            content: "'\u0192'"
        }
    },
    ".cm-completionIcon-class": {
        "&:after": {
            content: "'\u25CB'"
        }
    },
    ".cm-completionIcon-interface": {
        "&:after": {
            content: "'\u25CC'"
        }
    },
    ".cm-completionIcon-variable": {
        "&:after": {
            content: "'\uD835\uDC65'"
        }
    },
    ".cm-completionIcon-constant": {
        "&:after": {
            content: "'\uD835\uDC36'"
        }
    },
    ".cm-completionIcon-type": {
        "&:after": {
            content: "'\uD835\uDC61'"
        }
    },
    ".cm-completionIcon-enum": {
        "&:after": {
            content: "'\u222A'"
        }
    },
    ".cm-completionIcon-property": {
        "&:after": {
            content: "'\u25A1'"
        }
    },
    ".cm-completionIcon-keyword": {
        "&:after": {
            content: "'\uD83D\uDD11\uFE0E'"
        }
    },
    ".cm-completionIcon-namespace": {
        "&:after": {
            content: "'\u25A2'"
        }
    },
    ".cm-completionIcon-text": {
        "&:after": {
            content: "'abc'",
            fontSize: "50%",
            verticalAlign: "middle"
        }
    }
}), jg = new class extends $i {
};
jg.startSide = 1;
jg.endSide = -1;
function Aw(i = {}) {
    return [
        rt,
        We.of(i),
        Pw,
        Ew,
        Mw
    ];
}
const _w = [
    {
        key: "Ctrl-Space",
        run: Tw
    },
    {
        key: "Escape",
        run: xw
    },
    {
        key: "ArrowDown",
        run: ks(!0)
    },
    {
        key: "ArrowUp",
        run: ks(!1)
    },
    {
        key: "PageDown",
        run: ks(!0, "page")
    },
    {
        key: "PageUp",
        run: ks(!1, "page")
    },
    {
        key: "Enter",
        run: Cw
    }
], Ew = Mr.highest(To.computeN([
    We
], (i)=>i.facet(We).defaultKeymap ? [
        _w
    ] : []));
class Nw {
    constructor(e, t, n){
        this.from = e, this.to = t, this.diagnostic = n;
    }
}
class Fi {
    constructor(e, t, n){
        this.diagnostics = e, this.panel = t, this.selected = n;
    }
    static init(e, t, n) {
        let r = e, s = n.facet(Wg).markerFilter;
        s && (r = s(r));
        let o = ee.set(r.map((l)=>l.from == l.to || l.from == l.to - 1 && n.doc.lineAt(l.from).to == l.from ? ee.widget({
                widget: new Hw(l),
                diagnostic: l
            }).range(l.from) : ee.mark({
                attributes: {
                    class: "cm-lintRange cm-lintRange-" + l.severity + (l.markClass ? " " + l.markClass : "")
                },
                diagnostic: l
            }).range(l.from, l.to)), !0);
        return new Fi(o, t, bn(o));
    }
}
function bn(i, e = null, t = 0) {
    let n = null;
    return i.between(t, 1e9, (r, s, { spec: o })=>{
        if (!(e && o.diagnostic != e)) return n = new Nw(r, s, o.diagnostic), !1;
    }), n;
}
function Lw(i, e) {
    let t = i.startState.doc.lineAt(e.pos);
    return !!(i.effects.some((n)=>n.is(_c)) || i.changes.touchesRange(t.from, t.to));
}
function Bw(i, e) {
    return i.field(St, !1) ? e : e.concat(Z.appendConfig.of($w));
}
function Iw(i, e) {
    return {
        effects: Bw(i, [
            _c.of(e)
        ])
    };
}
const _c = Z.define(), Fg = Z.define(), Hg = Z.define(), St = pt.define({
    create () {
        return new Fi(ee.none, null, null);
    },
    update (i, e) {
        if (e.docChanged) {
            let t = i.diagnostics.map(e.changes), n = null;
            if (i.selected) {
                let r = e.changes.mapPos(i.selected.from, 1);
                n = bn(t, i.selected.diagnostic, r) || bn(t, null, r);
            }
            i = new Fi(t, i.panel, n);
        }
        for (let t of e.effects)t.is(_c) ? i = Fi.init(t.value, i.panel, e.state) : t.is(Fg) ? i = new Fi(i.diagnostics, t.value ? Ec.open : null, i.selected) : t.is(Hg) && (i = new Fi(i.diagnostics, i.panel, t.value));
        return i;
    },
    provide: (i)=>[
            zl.from(i, (e)=>e.panel),
            $.decorations.from(i, (e)=>e.diagnostics)
        ]
}), qw = ee.mark({
    class: "cm-lintRange cm-lintRange-active"
});
function jw(i, e, t) {
    let { diagnostics: n } = i.state.field(St), r = [], s = 2e8, o = 0;
    n.between(e - (t < 0 ? 1 : 0), e + (t > 0 ? 1 : 0), (a, c, { spec: h })=>{
        e >= a && e <= c && (a == c || (e > a || t > 0) && (e < c || t < 0)) && (r.push(h.diagnostic), s = Math.min(a, s), o = Math.max(c, o));
    });
    let l = i.state.facet(Wg).tooltipFilter;
    return l && (r = l(r)), r.length ? {
        pos: s,
        end: o,
        above: i.state.doc.lineAt(s).to < o,
        create () {
            return {
                dom: Fw(i, r)
            };
        }
    } : null;
}
function Fw(i, e) {
    return qt("ul", {
        class: "cm-tooltip-lint"
    }, e.map((t)=>$g(i, t, !1)));
}
const vu = (i)=>{
    let e = i.state.field(St, !1);
    return !e || !e.panel ? !1 : (i.dispatch({
        effects: Fg.of(!1)
    }), !0);
}, Wg = q.define({
    combine (i) {
        return Object.assign({
            sources: i.map((e)=>e.source)
        }, En(i.map((e)=>e.config), {
            delay: 750,
            markerFilter: null,
            tooltipFilter: null,
            needsRefresh: null
        }, {
            needsRefresh: (e, t)=>e ? t ? (n)=>e(n) || t(n) : e : t
        }));
    }
});
function Vg(i) {
    let e = [];
    if (i) e: for (let { name: t } of i){
        for(let n = 0; n < t.length; n++){
            let r = t[n];
            if (/[a-zA-Z]/.test(r) && !e.some((s)=>s.toLowerCase() == r.toLowerCase())) {
                e.push(r);
                continue e;
            }
        }
        e.push("");
    }
    return e;
}
function $g(i, e, t) {
    var n;
    let r = t ? Vg(e.actions) : [];
    return qt("li", {
        class: "cm-diagnostic cm-diagnostic-" + e.severity
    }, qt("span", {
        class: "cm-diagnosticText"
    }, e.renderMessage ? e.renderMessage() : e.message), (n = e.actions) === null || n === void 0 ? void 0 : n.map((s, o)=>{
        let l = !1, a = (f)=>{
            if (f.preventDefault(), l) return;
            l = !0;
            let d = bn(i.state.field(St).diagnostics, e);
            d && s.apply(i, d.from, d.to);
        }, { name: c } = s, h = r[o] ? c.indexOf(r[o]) : -1, u = h < 0 ? c : [
            c.slice(0, h),
            qt("u", c.slice(h, h + 1)),
            c.slice(h + 1)
        ];
        return qt("button", {
            type: "button",
            class: "cm-diagnosticAction",
            onclick: a,
            onmousedown: a,
            "aria-label": ` Action: ${c}${h < 0 ? "" : ` (access key "${r[o]})"`}.`
        }, u);
    }), e.source && qt("div", {
        class: "cm-diagnosticSource"
    }, e.source));
}
class Hw extends li {
    constructor(e){
        super(), this.diagnostic = e;
    }
    eq(e) {
        return e.diagnostic == this.diagnostic;
    }
    toDOM() {
        return qt("span", {
            class: "cm-lintPoint cm-lintPoint-" + this.diagnostic.severity
        });
    }
}
class wu {
    constructor(e, t){
        this.diagnostic = t, this.id = "item_" + Math.floor(Math.random() * 4294967295).toString(16), this.dom = $g(e, t, !0), this.dom.id = this.id, this.dom.setAttribute("role", "option");
    }
}
class Ec {
    constructor(e){
        this.view = e, this.items = [];
        let t = (r)=>{
            if (r.keyCode == 27) vu(this.view), this.view.focus();
            else if (r.keyCode == 38 || r.keyCode == 33) this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length);
            else if (r.keyCode == 40 || r.keyCode == 34) this.moveSelection((this.selectedIndex + 1) % this.items.length);
            else if (r.keyCode == 36) this.moveSelection(0);
            else if (r.keyCode == 35) this.moveSelection(this.items.length - 1);
            else if (r.keyCode == 13) this.view.focus();
            else if (r.keyCode >= 65 && r.keyCode <= 90 && this.selectedIndex >= 0) {
                let { diagnostic: s } = this.items[this.selectedIndex], o = Vg(s.actions);
                for(let l = 0; l < o.length; l++)if (o[l].toUpperCase().charCodeAt(0) == r.keyCode) {
                    let a = bn(this.view.state.field(St).diagnostics, s);
                    a && s.actions[l].apply(e, a.from, a.to);
                }
            } else return;
            r.preventDefault();
        }, n = (r)=>{
            for(let s = 0; s < this.items.length; s++)this.items[s].dom.contains(r.target) && this.moveSelection(s);
        };
        this.list = qt("ul", {
            tabIndex: 0,
            role: "listbox",
            "aria-label": this.view.state.phrase("Diagnostics"),
            onkeydown: t,
            onclick: n
        }), this.dom = qt("div", {
            class: "cm-panel-lint"
        }, this.list, qt("button", {
            type: "button",
            name: "close",
            "aria-label": this.view.state.phrase("close"),
            onclick: ()=>vu(this.view)
        }, "\xd7")), this.update();
    }
    get selectedIndex() {
        let e = this.view.state.field(St).selected;
        if (!e) return -1;
        for(let t = 0; t < this.items.length; t++)if (this.items[t].diagnostic == e.diagnostic) return t;
        return -1;
    }
    update() {
        let { diagnostics: e, selected: t } = this.view.state.field(St), n = 0, r = !1, s = null;
        for(e.between(0, this.view.state.doc.length, (o, l, { spec: a })=>{
            let c = -1, h;
            for(let u = n; u < this.items.length; u++)if (this.items[u].diagnostic == a.diagnostic) {
                c = u;
                break;
            }
            c < 0 ? (h = new wu(this.view, a.diagnostic), this.items.splice(n, 0, h), r = !0) : (h = this.items[c], c > n && (this.items.splice(n, c - n), r = !0)), t && h.diagnostic == t.diagnostic ? h.dom.hasAttribute("aria-selected") || (h.dom.setAttribute("aria-selected", "true"), s = h) : h.dom.hasAttribute("aria-selected") && h.dom.removeAttribute("aria-selected"), n++;
        }); n < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0);)r = !0, this.items.pop();
        this.items.length == 0 && (this.items.push(new wu(this.view, {
            from: -1,
            to: -1,
            severity: "info",
            message: this.view.state.phrase("No diagnostics")
        })), r = !0), s ? (this.list.setAttribute("aria-activedescendant", s.id), this.view.requestMeasure({
            key: this,
            read: ()=>({
                    sel: s.dom.getBoundingClientRect(),
                    panel: this.list.getBoundingClientRect()
                }),
            write: ({ sel: o, panel: l })=>{
                let a = l.height / this.list.offsetHeight;
                o.top < l.top ? this.list.scrollTop -= (l.top - o.top) / a : o.bottom > l.bottom && (this.list.scrollTop += (o.bottom - l.bottom) / a);
            }
        })) : this.selectedIndex < 0 && this.list.removeAttribute("aria-activedescendant"), r && this.sync();
    }
    sync() {
        let e = this.list.firstChild;
        function t() {
            let n = e;
            e = n.nextSibling, n.remove();
        }
        for (let n of this.items)if (n.dom.parentNode == this.list) {
            for(; e != n.dom;)t();
            e = n.dom.nextSibling;
        } else this.list.insertBefore(n.dom, e);
        for(; e;)t();
    }
    moveSelection(e) {
        if (this.selectedIndex < 0) return;
        let t = this.view.state.field(St), n = bn(t.diagnostics, this.items[e].diagnostic);
        n && this.view.dispatch({
            selection: {
                anchor: n.from,
                head: n.to
            },
            scrollIntoView: !0,
            effects: Hg.of(n)
        });
    }
    static open(e) {
        return new Ec(e);
    }
}
function Ww(i, e = 'viewBox="0 0 40 40"') {
    return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${e}>${encodeURIComponent(i)}</svg>')`;
}
function Ss(i) {
    return Ww(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${i}" fill="none" stroke-width=".7"/>`, 'width="6" height="3"');
}
const Vw = $.baseTheme({
    ".cm-diagnostic": {
        padding: "3px 6px 3px 8px",
        marginLeft: "-1px",
        display: "block",
        whiteSpace: "pre-wrap"
    },
    ".cm-diagnostic-error": {
        borderLeft: "5px solid #d11"
    },
    ".cm-diagnostic-warning": {
        borderLeft: "5px solid orange"
    },
    ".cm-diagnostic-info": {
        borderLeft: "5px solid #999"
    },
    ".cm-diagnostic-hint": {
        borderLeft: "5px solid #66d"
    },
    ".cm-diagnosticAction": {
        font: "inherit",
        border: "none",
        padding: "2px 4px",
        backgroundColor: "#444",
        color: "white",
        borderRadius: "3px",
        marginLeft: "8px",
        cursor: "pointer"
    },
    ".cm-diagnosticSource": {
        fontSize: "70%",
        opacity: .7
    },
    ".cm-lintRange": {
        backgroundPosition: "left bottom",
        backgroundRepeat: "repeat-x",
        paddingBottom: "0.7px"
    },
    ".cm-lintRange-error": {
        backgroundImage: Ss("#d11")
    },
    ".cm-lintRange-warning": {
        backgroundImage: Ss("orange")
    },
    ".cm-lintRange-info": {
        backgroundImage: Ss("#999")
    },
    ".cm-lintRange-hint": {
        backgroundImage: Ss("#66d")
    },
    ".cm-lintRange-active": {
        backgroundColor: "#ffdd9980"
    },
    ".cm-tooltip-lint": {
        padding: 0,
        margin: 0
    },
    ".cm-lintPoint": {
        position: "relative",
        "&:after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: "-2px",
            borderLeft: "3px solid transparent",
            borderRight: "3px solid transparent",
            borderBottom: "4px solid #d11"
        }
    },
    ".cm-lintPoint-warning": {
        "&:after": {
            borderBottomColor: "orange"
        }
    },
    ".cm-lintPoint-info": {
        "&:after": {
            borderBottomColor: "#999"
        }
    },
    ".cm-lintPoint-hint": {
        "&:after": {
            borderBottomColor: "#66d"
        }
    },
    ".cm-panel.cm-panel-lint": {
        position: "relative",
        "& ul": {
            maxHeight: "100px",
            overflowY: "auto",
            "& [aria-selected]": {
                backgroundColor: "#ddd",
                "& u": {
                    textDecoration: "underline"
                }
            },
            "&:focus [aria-selected]": {
                background_fallback: "#bdf",
                backgroundColor: "Highlight",
                color_fallback: "white",
                color: "HighlightText"
            },
            "& u": {
                textDecoration: "none"
            },
            padding: 0,
            margin: 0
        },
        "& [name=close]": {
            position: "absolute",
            top: "0",
            right: "2px",
            background: "inherit",
            border: "none",
            font: "inherit",
            padding: 0,
            margin: 0
        }
    }
}), $w = [
    St,
    $.decorations.compute([
        St
    ], (i)=>{
        let { selected: e, panel: t } = i.field(St);
        return !e || !t || e.from == e.to ? ee.none : ee.set([
            qw.range(e.from, e.to)
        ]);
    }),
    Np(jw, {
        hideOn: Lw
    }),
    Vw
], zw = (()=>[
        My(),
        rv(),
        ky(),
        eg(jb, {
            fallback: !0
        }),
        To.of([
            ...sw,
            ...dv
        ])
    ])();
var H = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function zg(i) {
    if (i.__esModule) return i;
    var e = i.default;
    if (typeof e == "function") {
        var t = function n() {
            return this instanceof n ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
        };
        t.prototype = e.prototype;
    } else t = {};
    return Object.defineProperty(t, "__esModule", {
        value: !0
    }), Object.keys(i).forEach(function(n) {
        var r = Object.getOwnPropertyDescriptor(i, n);
        Object.defineProperty(t, n, r.get ? r : {
            enumerable: !0,
            get: function() {
                return i[n];
            }
        });
    }), t;
}
var io = {}, Ug = {}, Nc = {
    exports: {}
}, dn = typeof Reflect == "object" ? Reflect : null, ku = dn && typeof dn.apply == "function" ? dn.apply : function(e, t, n) {
    return Function.prototype.apply.call(e, t, n);
}, Ls;
dn && typeof dn.ownKeys == "function" ? Ls = dn.ownKeys : Object.getOwnPropertySymbols ? Ls = function(e) {
    return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
} : Ls = function(e) {
    return Object.getOwnPropertyNames(e);
};
function Uw(i) {
    console && console.warn && console.warn(i);
}
var Kg = Number.isNaN || function(e) {
    return e !== e;
};
function re() {
    re.init.call(this);
}
Nc.exports = re;
Nc.exports.once = Qw;
re.EventEmitter = re;
re.prototype._events = void 0;
re.prototype._eventsCount = 0;
re.prototype._maxListeners = void 0;
var Su = 10;
function Mo(i) {
    if (typeof i != "function") throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof i);
}
Object.defineProperty(re, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
        return Su;
    },
    set: function(i) {
        if (typeof i != "number" || i < 0 || Kg(i)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + i + ".");
        Su = i;
    }
});
re.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
};
re.prototype.setMaxListeners = function(e) {
    if (typeof e != "number" || e < 0 || Kg(e)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
    return this._maxListeners = e, this;
};
function Gg(i) {
    return i._maxListeners === void 0 ? re.defaultMaxListeners : i._maxListeners;
}
re.prototype.getMaxListeners = function() {
    return Gg(this);
};
re.prototype.emit = function(e) {
    for(var t = [], n = 1; n < arguments.length; n++)t.push(arguments[n]);
    var r = e === "error", s = this._events;
    if (s !== void 0) r = r && s.error === void 0;
    else if (!r) return !1;
    if (r) {
        var o;
        if (t.length > 0 && (o = t[0]), o instanceof Error) throw o;
        var l = new Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
        throw l.context = o, l;
    }
    var a = s[e];
    if (a === void 0) return !1;
    if (typeof a == "function") ku(a, this, t);
    else for(var c = a.length, h = Zg(a, c), n = 0; n < c; ++n)ku(h[n], this, t);
    return !0;
};
function Jg(i, e, t, n) {
    var r, s, o;
    if (Mo(t), s = i._events, s === void 0 ? (s = i._events = Object.create(null), i._eventsCount = 0) : (s.newListener !== void 0 && (i.emit("newListener", e, t.listener ? t.listener : t), s = i._events), o = s[e]), o === void 0) o = s[e] = t, ++i._eventsCount;
    else if (typeof o == "function" ? o = s[e] = n ? [
        t,
        o
    ] : [
        o,
        t
    ] : n ? o.unshift(t) : o.push(t), r = Gg(i), r > 0 && o.length > r && !o.warned) {
        o.warned = !0;
        var l = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
        l.name = "MaxListenersExceededWarning", l.emitter = i, l.type = e, l.count = o.length, Uw(l);
    }
    return i;
}
re.prototype.addListener = function(e, t) {
    return Jg(this, e, t, !1);
};
re.prototype.on = re.prototype.addListener;
re.prototype.prependListener = function(e, t) {
    return Jg(this, e, t, !0);
};
function Kw() {
    if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function Qg(i, e, t) {
    var n = {
        fired: !1,
        wrapFn: void 0,
        target: i,
        type: e,
        listener: t
    }, r = Kw.bind(n);
    return r.listener = t, n.wrapFn = r, r;
}
re.prototype.once = function(e, t) {
    return Mo(t), this.on(e, Qg(this, e, t)), this;
};
re.prototype.prependOnceListener = function(e, t) {
    return Mo(t), this.prependListener(e, Qg(this, e, t)), this;
};
re.prototype.removeListener = function(e, t) {
    var n, r, s, o, l;
    if (Mo(t), r = this._events, r === void 0) return this;
    if (n = r[e], n === void 0) return this;
    if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = Object.create(null) : (delete r[e], r.removeListener && this.emit("removeListener", e, n.listener || t));
    else if (typeof n != "function") {
        for(s = -1, o = n.length - 1; o >= 0; o--)if (n[o] === t || n[o].listener === t) {
            l = n[o].listener, s = o;
            break;
        }
        if (s < 0) return this;
        s === 0 ? n.shift() : Gw(n, s), n.length === 1 && (r[e] = n[0]), r.removeListener !== void 0 && this.emit("removeListener", e, l || t);
    }
    return this;
};
re.prototype.off = re.prototype.removeListener;
re.prototype.removeAllListeners = function(e) {
    var t, n, r;
    if (n = this._events, n === void 0) return this;
    if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = Object.create(null) : delete n[e]), this;
    if (arguments.length === 0) {
        var s = Object.keys(n), o;
        for(r = 0; r < s.length; ++r)o = s[r], o !== "removeListener" && this.removeAllListeners(o);
        return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
    }
    if (t = n[e], typeof t == "function") this.removeListener(e, t);
    else if (t !== void 0) for(r = t.length - 1; r >= 0; r--)this.removeListener(e, t[r]);
    return this;
};
function Yg(i, e, t) {
    var n = i._events;
    if (n === void 0) return [];
    var r = n[e];
    return r === void 0 ? [] : typeof r == "function" ? t ? [
        r.listener || r
    ] : [
        r
    ] : t ? Jw(r) : Zg(r, r.length);
}
re.prototype.listeners = function(e) {
    return Yg(this, e, !0);
};
re.prototype.rawListeners = function(e) {
    return Yg(this, e, !1);
};
re.listenerCount = function(i, e) {
    return typeof i.listenerCount == "function" ? i.listenerCount(e) : Xg.call(i, e);
};
re.prototype.listenerCount = Xg;
function Xg(i) {
    var e = this._events;
    if (e !== void 0) {
        var t = e[i];
        if (typeof t == "function") return 1;
        if (t !== void 0) return t.length;
    }
    return 0;
}
re.prototype.eventNames = function() {
    return this._eventsCount > 0 ? Ls(this._events) : [];
};
function Zg(i, e) {
    for(var t = new Array(e), n = 0; n < e; ++n)t[n] = i[n];
    return t;
}
function Gw(i, e) {
    for(; e + 1 < i.length; e++)i[e] = i[e + 1];
    i.pop();
}
function Jw(i) {
    for(var e = new Array(i.length), t = 0; t < e.length; ++t)e[t] = i[t].listener || i[t];
    return e;
}
function Qw(i, e) {
    return new Promise(function(t, n) {
        function r(o) {
            i.removeListener(e, s), n(o);
        }
        function s() {
            typeof i.removeListener == "function" && i.removeListener("error", r), t([].slice.call(arguments));
        }
        em(i, e, s, {
            once: !0
        }), e !== "error" && Yw(i, r, {
            once: !0
        });
    });
}
function Yw(i, e, t) {
    typeof i.on == "function" && em(i, "error", e, t);
}
function em(i, e, t, n) {
    if (typeof i.on == "function") n.once ? i.once(e, t) : i.on(e, t);
    else if (typeof i.addEventListener == "function") i.addEventListener(e, function r(s) {
        n.once && i.removeEventListener(e, r), t(s);
    });
    else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof i);
}
var tm = Nc.exports;
(function(i) {
    var e = H && H.__awaiter || function(s, o, l, a) {
        function c(h) {
            return h instanceof l ? h : new l(function(u) {
                u(h);
            });
        }
        return new (l || (l = Promise))(function(h, u) {
            function f(y) {
                try {
                    p(a.next(y));
                } catch (b) {
                    u(b);
                }
            }
            function d(y) {
                try {
                    p(a.throw(y));
                } catch (b) {
                    u(b);
                }
            }
            function p(y) {
                y.done ? h(y.value) : c(y.value).then(f, d);
            }
            p((a = a.apply(s, o || [])).next());
        });
    }, t = H && H.__generator || function(s, o) {
        var l = {
            label: 0,
            sent: function() {
                if (h[0] & 1) throw h[1];
                return h[1];
            },
            trys: [],
            ops: []
        }, a, c, h, u;
        return u = {
            next: f(0),
            throw: f(1),
            return: f(2)
        }, typeof Symbol == "function" && (u[Symbol.iterator] = function() {
            return this;
        }), u;
        function f(p) {
            return function(y) {
                return d([
                    p,
                    y
                ]);
            };
        }
        function d(p) {
            if (a) throw new TypeError("Generator is already executing.");
            for(; l;)try {
                if (a = 1, c && (h = p[0] & 2 ? c.return : p[0] ? c.throw || ((h = c.return) && h.call(c), 0) : c.next) && !(h = h.call(c, p[1])).done) return h;
                switch(c = 0, h && (p = [
                    p[0] & 2,
                    h.value
                ]), p[0]){
                    case 0:
                    case 1:
                        h = p;
                        break;
                    case 4:
                        return l.label++, {
                            value: p[1],
                            done: !1
                        };
                    case 5:
                        l.label++, c = p[1], p = [
                            0
                        ];
                        continue;
                    case 7:
                        p = l.ops.pop(), l.trys.pop();
                        continue;
                    default:
                        if (h = l.trys, !(h = h.length > 0 && h[h.length - 1]) && (p[0] === 6 || p[0] === 2)) {
                            l = 0;
                            continue;
                        }
                        if (p[0] === 3 && (!h || p[1] > h[0] && p[1] < h[3])) {
                            l.label = p[1];
                            break;
                        }
                        if (p[0] === 6 && l.label < h[1]) {
                            l.label = h[1], h = p;
                            break;
                        }
                        if (h && l.label < h[2]) {
                            l.label = h[2], l.ops.push(p);
                            break;
                        }
                        h[2] && l.ops.pop(), l.trys.pop();
                        continue;
                }
                p = o.call(s, l);
            } catch (y) {
                p = [
                    6,
                    y
                ], c = 0;
            } finally{
                a = h = 0;
            }
            if (p[0] & 5) throw p[1];
            return {
                value: p[0] ? p[1] : void 0,
                done: !0
            };
        }
    };
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.defaultNextRequest = void 0;
    var n = tm;
    i.defaultNextRequest = function() {
        var s = -1;
        return function() {
            return ++s;
        };
    };
    var r = function() {
        function s(o, l) {
            l === void 0 && (l = i.defaultNextRequest()), this.batch = [], this.batchStarted = !1, this.lastId = -1, this.transports = o, this.requests = {}, this.connectPromise = this.connect(), this.requestChannel = new n.EventEmitter, this.nextID = l;
        }
        return s.prototype.connect = function() {
            var o = this;
            return Promise.all(this.transports.map(function(l) {
                return e(o, void 0, void 0, function() {
                    return t(this, function(a) {
                        switch(a.label){
                            case 0:
                                return l.subscribe("error", this.handleError.bind(this)), l.subscribe("notification", this.handleNotification.bind(this)), [
                                    4,
                                    l.connect()
                                ];
                            case 1:
                                return a.sent(), [
                                    2
                                ];
                        }
                    });
                });
            }));
        }, s.prototype.getPrimaryTransport = function() {
            return this.transports[0];
        }, s.prototype.request = function(o, l, a) {
            return l === void 0 && (l = !1), e(this, void 0, void 0, function() {
                var c, h, u, f, d = this;
                return t(this, function(p) {
                    return c = this.nextID().toString(), h = l ? null : c, u = {
                        request: this.makeRequest(o.method, o.params || [], h),
                        internalID: c
                    }, this.batchStarted ? (f = new Promise(function(y, b) {
                        d.batch.push({
                            resolve: y,
                            reject: b,
                            request: u
                        });
                    }), [
                        2,
                        f
                    ]) : [
                        2,
                        this.getPrimaryTransport().sendData(u, a)
                    ];
                });
            });
        }, s.prototype.close = function() {
            this.requestChannel.removeAllListeners(), this.transports.forEach(function(o) {
                o.unsubscribe(), o.close();
            });
        }, s.prototype.startBatch = function() {
            this.batchStarted = !0;
        }, s.prototype.stopBatch = function() {
            if (this.batchStarted === !1) throw new Error("cannot end that which has never started");
            if (this.batch.length === 0) {
                this.batchStarted = !1;
                return;
            }
            this.getPrimaryTransport().sendData(this.batch), this.batch = [], this.batchStarted = !1;
        }, s.prototype.makeRequest = function(o, l, a) {
            return a ? {
                jsonrpc: "2.0",
                id: a,
                method: o,
                params: l
            } : {
                jsonrpc: "2.0",
                method: o,
                params: l
            };
        }, s.prototype.handleError = function(o) {
            this.requestChannel.emit("error", o);
        }, s.prototype.handleNotification = function(o) {
            this.requestChannel.emit("notification", o);
        }, s;
    }();
    i.default = r;
})(Ug);
var Lc = {}, Mi = {}, Ao = {}, Ln = {};
(function(i) {
    var e = H && H.__extends || function() {
        var n = function(r, s) {
            return n = Object.setPrototypeOf || ({
                __proto__: []
            }) instanceof Array && function(o, l) {
                o.__proto__ = l;
            } || function(o, l) {
                for(var a in l)l.hasOwnProperty(a) && (o[a] = l[a]);
            }, n(r, s);
        };
        return function(r, s) {
            n(r, s);
            function o() {
                this.constructor = r;
            }
            r.prototype = s === null ? Object.create(s) : (o.prototype = s.prototype, new o);
        };
    }();
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.convertJSONToRPCError = i.JSONRPCError = i.ERR_UNKNOWN = i.ERR_MISSIING_ID = i.ERR_TIMEOUT = void 0, i.ERR_TIMEOUT = 7777, i.ERR_MISSIING_ID = 7878, i.ERR_UNKNOWN = 7979;
    var t = function(n) {
        e(r, n);
        function r(s, o, l) {
            var a = this.constructor, c = n.call(this, s) || this;
            return c.message = s, c.code = o, c.data = l, Object.setPrototypeOf(c, a.prototype), c;
        }
        return r;
    }(Error);
    i.JSONRPCError = t, i.convertJSONToRPCError = function(n) {
        if (n.error) {
            var r = n.error, s = r.message, o = r.code, l = r.data;
            return new t(s, o, l);
        }
        return new t("Unknown error", i.ERR_UNKNOWN, n);
    };
})(Ln);
Object.defineProperty(Ao, "__esModule", {
    value: !0
});
Ao.TransportRequestManager = void 0;
var Xw = tm, rn = Ln, Zw = function() {
    function i() {
        this.pendingRequest = {}, this.pendingBatchRequest = {}, this.transportEventChannel = new Xw.EventEmitter;
    }
    return i.prototype.addRequest = function(e, t) {
        return this.transportEventChannel.emit("pending", e), e instanceof Array ? (this.addBatchReq(e, t), Promise.resolve()) : this.addReq(e.internalID, t);
    }, i.prototype.settlePendingRequest = function(e, t) {
        var n = this;
        e.forEach(function(r) {
            var s = n.pendingRequest[r.internalID];
            if (delete n.pendingBatchRequest[r.internalID], s !== void 0) {
                if (t) {
                    s.reject(t);
                    return;
                }
                s.resolve(), (r.request.id === null || r.request.id === void 0) && delete n.pendingRequest[r.internalID];
            }
        });
    }, i.prototype.isPendingRequest = function(e) {
        return this.pendingRequest.hasOwnProperty(e);
    }, i.prototype.resolveResponse = function(e, t) {
        t === void 0 && (t = !0);
        var n = e;
        try {
            return n = JSON.parse(e), this.checkJSONRPC(n) === !1 ? void 0 : n instanceof Array ? this.resolveBatch(n, t) : this.resolveRes(n, t);
        } catch  {
            var r = new rn.JSONRPCError("Bad response format", rn.ERR_UNKNOWN, e);
            return t && this.transportEventChannel.emit("error", r), r;
        }
    }, i.prototype.addBatchReq = function(e, t) {
        var n = this;
        return e.forEach(function(r) {
            var s = r.resolve, o = r.reject, l = r.request.internalID;
            n.pendingBatchRequest[l] = !0, n.pendingRequest[l] = {
                resolve: s,
                reject: o
            };
        }), Promise.resolve();
    }, i.prototype.addReq = function(e, t) {
        var n = this;
        return new Promise(function(r, s) {
            t !== null && t && n.setRequestTimeout(e, t, s), n.pendingRequest[e] = {
                resolve: r,
                reject: s
            };
        });
    }, i.prototype.checkJSONRPC = function(e) {
        var t = [
            e
        ];
        return e instanceof Array && (t = e), t.every(function(n) {
            return n.result !== void 0 || n.error !== void 0 || n.method !== void 0;
        });
    }, i.prototype.processResult = function(e, t) {
        if (e.error) {
            var n = rn.convertJSONToRPCError(e);
            t.reject(n);
            return;
        }
        t.resolve(e.result);
    }, i.prototype.resolveBatch = function(e, t) {
        var n = this, r = e.map(function(o) {
            return n.resolveRes(o, t);
        }), s = r.filter(function(o) {
            return o;
        });
        if (s.length > 0) return s[0];
    }, i.prototype.resolveRes = function(e, t) {
        var n = e.id, r = e.error, s = this.pendingRequest[n];
        if (s) {
            delete this.pendingRequest[n], this.processResult(e, s), this.transportEventChannel.emit("response", e);
            return;
        }
        if (n === void 0 && r === void 0) {
            this.transportEventChannel.emit("notification", e);
            return;
        }
        var o;
        return r && (o = rn.convertJSONToRPCError(e)), t && r && o && this.transportEventChannel.emit("error", o), o;
    }, i.prototype.setRequestTimeout = function(e, t, n) {
        var r = this;
        setTimeout(function() {
            delete r.pendingRequest[e], n(new rn.JSONRPCError("Request timeout request took longer than " + t + " ms to resolve", rn.ERR_TIMEOUT));
        }, t);
    }, i;
}();
Ao.TransportRequestManager = Zw;
Object.defineProperty(Mi, "__esModule", {
    value: !0
});
Mi.Transport = void 0;
var e1 = Ao, t1 = function() {
    function i() {
        this.transportRequestManager = new e1.TransportRequestManager, this.transportRequestManager.transportEventChannel.on("error", function() {});
    }
    return i.prototype.subscribe = function(e, t) {
        this.transportRequestManager.transportEventChannel.addListener(e, t);
    }, i.prototype.unsubscribe = function(e, t) {
        if (!e) return this.transportRequestManager.transportEventChannel.removeAllListeners();
        e && t && this.transportRequestManager.transportEventChannel.removeListener(e, t);
    }, i.prototype.parseData = function(e) {
        return e instanceof Array ? e.map(function(t) {
            return t.request.request;
        }) : e.request;
    }, i;
}();
Mi.Transport = t1;
var Bn = {};
(function(i) {
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.getNotifications = i.getBatchRequests = i.isNotification = void 0, i.isNotification = function(e) {
        return e.request.id === void 0 || e.request.id === null;
    }, i.getBatchRequests = function(e) {
        return e instanceof Array ? e.filter(function(t) {
            var n = t.request.request.id;
            return n != null;
        }).map(function(t) {
            return t.request;
        }) : [];
    }, i.getNotifications = function(e) {
        return e instanceof Array ? e.filter(function(t) {
            return i.isNotification(t.request);
        }).map(function(t) {
            return t.request;
        }) : i.isNotification(e) ? [
            e
        ] : [];
    };
})(Bn);
var i1 = H && H.__extends || function() {
    var i = function(e, t) {
        return i = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(n, r) {
            n.__proto__ = r;
        } || function(n, r) {
            for(var s in r)r.hasOwnProperty(s) && (n[s] = r[s]);
        }, i(e, t);
    };
    return function(e, t) {
        i(e, t);
        function n() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n);
    };
}();
Object.defineProperty(Lc, "__esModule", {
    value: !0
});
var n1 = Mi, r1 = Bn, Cu = Ln, s1 = function(i) {
    i1(e, i);
    function e(t, n, r) {
        var s = i.call(this) || this;
        return s.connection = t, s.reqUri = n, s.resUri = r, s;
    }
    return e.prototype.connect = function() {
        var t = this;
        return this.connection.on(this.resUri, function(n) {
            t.transportRequestManager.resolveResponse(n);
        }), Promise.resolve();
    }, e.prototype.sendData = function(t, n) {
        n === void 0 && (n = null);
        var r = this.transportRequestManager.addRequest(t, n), s = r1.getNotifications(t), o = this.parseData(t);
        try {
            return this.connection.emit(this.reqUri, o), this.transportRequestManager.settlePendingRequest(s), r;
        } catch (a) {
            var l = new Cu.JSONRPCError(a.message, Cu.ERR_UNKNOWN, a);
            return this.transportRequestManager.settlePendingRequest(s, l), Promise.reject(l);
        }
    }, e.prototype.close = function() {
        this.connection.removeAllListeners();
    }, e;
}(n1.Transport);
Lc.default = s1;
var Ir = {}, Le = typeof globalThis < "u" && globalThis || typeof self < "u" && self || typeof global < "u" && global || {}, Ue = {
    searchParams: "URLSearchParams" in Le,
    iterable: "Symbol" in Le && "iterator" in Symbol,
    blob: "FileReader" in Le && "Blob" in Le && function() {
        try {
            return new Blob, !0;
        } catch  {
            return !1;
        }
    }(),
    formData: "FormData" in Le,
    arrayBuffer: "ArrayBuffer" in Le
};
function o1(i) {
    return i && DataView.prototype.isPrototypeOf(i);
}
if (Ue.arrayBuffer) var l1 = [
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]"
], a1 = ArrayBuffer.isView || function(i) {
    return i && l1.indexOf(Object.prototype.toString.call(i)) > -1;
};
function In(i) {
    if (typeof i != "string" && (i = String(i)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(i) || i === "") throw new TypeError('Invalid character in header field name: "' + i + '"');
    return i.toLowerCase();
}
function Bc(i) {
    return typeof i != "string" && (i = String(i)), i;
}
function Ic(i) {
    var e = {
        next: function() {
            var t = i.shift();
            return {
                done: t === void 0,
                value: t
            };
        }
    };
    return Ue.iterable && (e[Symbol.iterator] = function() {
        return e;
    }), e;
}
function Me(i) {
    this.map = {}, i instanceof Me ? i.forEach(function(e, t) {
        this.append(t, e);
    }, this) : Array.isArray(i) ? i.forEach(function(e) {
        if (e.length != 2) throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + e.length);
        this.append(e[0], e[1]);
    }, this) : i && Object.getOwnPropertyNames(i).forEach(function(e) {
        this.append(e, i[e]);
    }, this);
}
Me.prototype.append = function(i, e) {
    i = In(i), e = Bc(e);
    var t = this.map[i];
    this.map[i] = t ? t + ", " + e : e;
};
Me.prototype.delete = function(i) {
    delete this.map[In(i)];
};
Me.prototype.get = function(i) {
    return i = In(i), this.has(i) ? this.map[i] : null;
};
Me.prototype.has = function(i) {
    return this.map.hasOwnProperty(In(i));
};
Me.prototype.set = function(i, e) {
    this.map[In(i)] = Bc(e);
};
Me.prototype.forEach = function(i, e) {
    for(var t in this.map)this.map.hasOwnProperty(t) && i.call(e, this.map[t], t, this);
};
Me.prototype.keys = function() {
    var i = [];
    return this.forEach(function(e, t) {
        i.push(t);
    }), Ic(i);
};
Me.prototype.values = function() {
    var i = [];
    return this.forEach(function(e) {
        i.push(e);
    }), Ic(i);
};
Me.prototype.entries = function() {
    var i = [];
    return this.forEach(function(e, t) {
        i.push([
            t,
            e
        ]);
    }), Ic(i);
};
Ue.iterable && (Me.prototype[Symbol.iterator] = Me.prototype.entries);
function al(i) {
    if (!i._noBody) {
        if (i.bodyUsed) return Promise.reject(new TypeError("Already read"));
        i.bodyUsed = !0;
    }
}
function im(i) {
    return new Promise(function(e, t) {
        i.onload = function() {
            e(i.result);
        }, i.onerror = function() {
            t(i.error);
        };
    });
}
function c1(i) {
    var e = new FileReader, t = im(e);
    return e.readAsArrayBuffer(i), t;
}
function h1(i) {
    var e = new FileReader, t = im(e), n = /charset=([A-Za-z0-9_-]+)/.exec(i.type), r = n ? n[1] : "utf-8";
    return e.readAsText(i, r), t;
}
function u1(i) {
    for(var e = new Uint8Array(i), t = new Array(e.length), n = 0; n < e.length; n++)t[n] = String.fromCharCode(e[n]);
    return t.join("");
}
function Tu(i) {
    if (i.slice) return i.slice(0);
    var e = new Uint8Array(i.byteLength);
    return e.set(new Uint8Array(i)), e.buffer;
}
function nm() {
    return this.bodyUsed = !1, this._initBody = function(i) {
        this.bodyUsed = this.bodyUsed, this._bodyInit = i, i ? typeof i == "string" ? this._bodyText = i : Ue.blob && Blob.prototype.isPrototypeOf(i) ? this._bodyBlob = i : Ue.formData && FormData.prototype.isPrototypeOf(i) ? this._bodyFormData = i : Ue.searchParams && URLSearchParams.prototype.isPrototypeOf(i) ? this._bodyText = i.toString() : Ue.arrayBuffer && Ue.blob && o1(i) ? (this._bodyArrayBuffer = Tu(i.buffer), this._bodyInit = new Blob([
            this._bodyArrayBuffer
        ])) : Ue.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(i) || a1(i)) ? this._bodyArrayBuffer = Tu(i) : this._bodyText = i = Object.prototype.toString.call(i) : (this._noBody = !0, this._bodyText = ""), this.headers.get("content-type") || (typeof i == "string" ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : Ue.searchParams && URLSearchParams.prototype.isPrototypeOf(i) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
    }, Ue.blob && (this.blob = function() {
        var i = al(this);
        if (i) return i;
        if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
        if (this._bodyArrayBuffer) return Promise.resolve(new Blob([
            this._bodyArrayBuffer
        ]));
        if (this._bodyFormData) throw new Error("could not read FormData body as blob");
        return Promise.resolve(new Blob([
            this._bodyText
        ]));
    }), this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
            var i = al(this);
            return i || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset, this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength)) : Promise.resolve(this._bodyArrayBuffer));
        } else {
            if (Ue.blob) return this.blob().then(c1);
            throw new Error("could not read as ArrayBuffer");
        }
    }, this.text = function() {
        var i = al(this);
        if (i) return i;
        if (this._bodyBlob) return h1(this._bodyBlob);
        if (this._bodyArrayBuffer) return Promise.resolve(u1(this._bodyArrayBuffer));
        if (this._bodyFormData) throw new Error("could not read FormData body as text");
        return Promise.resolve(this._bodyText);
    }, Ue.formData && (this.formData = function() {
        return this.text().then(p1);
    }), this.json = function() {
        return this.text().then(JSON.parse);
    }, this;
}
var f1 = [
    "CONNECT",
    "DELETE",
    "GET",
    "HEAD",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
    "TRACE"
];
function d1(i) {
    var e = i.toUpperCase();
    return f1.indexOf(e) > -1 ? e : i;
}
function Gi(i, e) {
    if (!(this instanceof Gi)) throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
    e = e || {};
    var t = e.body;
    if (i instanceof Gi) {
        if (i.bodyUsed) throw new TypeError("Already read");
        this.url = i.url, this.credentials = i.credentials, e.headers || (this.headers = new Me(i.headers)), this.method = i.method, this.mode = i.mode, this.signal = i.signal, !t && i._bodyInit != null && (t = i._bodyInit, i.bodyUsed = !0);
    } else this.url = String(i);
    if (this.credentials = e.credentials || this.credentials || "same-origin", (e.headers || !this.headers) && (this.headers = new Me(e.headers)), this.method = d1(e.method || this.method || "GET"), this.mode = e.mode || this.mode || null, this.signal = e.signal || this.signal || function() {
        if ("AbortController" in Le) {
            var s = new AbortController;
            return s.signal;
        }
    }(), this.referrer = null, (this.method === "GET" || this.method === "HEAD") && t) throw new TypeError("Body not allowed for GET or HEAD requests");
    if (this._initBody(t), (this.method === "GET" || this.method === "HEAD") && (e.cache === "no-store" || e.cache === "no-cache")) {
        var n = /([?&])_=[^&]*/;
        if (n.test(this.url)) this.url = this.url.replace(n, "$1_=" + new Date().getTime());
        else {
            var r = /\?/;
            this.url += (r.test(this.url) ? "&" : "?") + "_=" + new Date().getTime();
        }
    }
}
Gi.prototype.clone = function() {
    return new Gi(this, {
        body: this._bodyInit
    });
};
function p1(i) {
    var e = new FormData;
    return i.trim().split("&").forEach(function(t) {
        if (t) {
            var n = t.split("="), r = n.shift().replace(/\+/g, " "), s = n.join("=").replace(/\+/g, " ");
            e.append(decodeURIComponent(r), decodeURIComponent(s));
        }
    }), e;
}
function g1(i) {
    var e = new Me, t = i.replace(/\r?\n[\t ]+/g, " ");
    return t.split("\r").map(function(n) {
        return n.indexOf(`
`) === 0 ? n.substr(1, n.length) : n;
    }).forEach(function(n) {
        var r = n.split(":"), s = r.shift().trim();
        if (s) {
            var o = r.join(":").trim();
            try {
                e.append(s, o);
            } catch (l) {
                console.warn("Response " + l.message);
            }
        }
    }), e;
}
nm.call(Gi.prototype);
function $t(i, e) {
    if (!(this instanceof $t)) throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
    if (e || (e = {}), this.type = "default", this.status = e.status === void 0 ? 200 : e.status, this.status < 200 || this.status > 599) throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
    this.ok = this.status >= 200 && this.status < 300, this.statusText = e.statusText === void 0 ? "" : "" + e.statusText, this.headers = new Me(e.headers), this.url = e.url || "", this._initBody(i);
}
nm.call($t.prototype);
$t.prototype.clone = function() {
    return new $t(this._bodyInit, {
        status: this.status,
        statusText: this.statusText,
        headers: new Me(this.headers),
        url: this.url
    });
};
$t.error = function() {
    var i = new $t(null, {
        status: 200,
        statusText: ""
    });
    return i.status = 0, i.type = "error", i;
};
var m1 = [
    301,
    302,
    303,
    307,
    308
];
$t.redirect = function(i, e) {
    if (m1.indexOf(e) === -1) throw new RangeError("Invalid status code");
    return new $t(null, {
        status: e,
        headers: {
            location: i
        }
    });
};
var Hi = Le.DOMException;
try {
    new Hi;
} catch  {
    Hi = function(e, t) {
        this.message = e, this.name = t;
        var n = Error(e);
        this.stack = n.stack;
    }, Hi.prototype = Object.create(Error.prototype), Hi.prototype.constructor = Hi;
}
function rm(i, e) {
    return new Promise(function(t, n) {
        var r = new Gi(i, e);
        if (r.signal && r.signal.aborted) return n(new Hi("Aborted", "AbortError"));
        var s = new XMLHttpRequest;
        function o() {
            s.abort();
        }
        s.onload = function() {
            var c = {
                statusText: s.statusText,
                headers: g1(s.getAllResponseHeaders() || "")
            };
            r.url.startsWith("file://") && (s.status < 200 || s.status > 599) ? c.status = 200 : c.status = s.status, c.url = "responseURL" in s ? s.responseURL : c.headers.get("X-Request-URL");
            var h = "response" in s ? s.response : s.responseText;
            setTimeout(function() {
                t(new $t(h, c));
            }, 0);
        }, s.onerror = function() {
            setTimeout(function() {
                n(new TypeError("Network request failed"));
            }, 0);
        }, s.ontimeout = function() {
            setTimeout(function() {
                n(new TypeError("Network request timed out"));
            }, 0);
        }, s.onabort = function() {
            setTimeout(function() {
                n(new Hi("Aborted", "AbortError"));
            }, 0);
        };
        function l(c) {
            try {
                return c === "" && Le.location.href ? Le.location.href : c;
            } catch  {
                return c;
            }
        }
        if (s.open(r.method, l(r.url), !0), r.credentials === "include" ? s.withCredentials = !0 : r.credentials === "omit" && (s.withCredentials = !1), "responseType" in s && (Ue.blob ? s.responseType = "blob" : Ue.arrayBuffer && (s.responseType = "arraybuffer")), e && typeof e.headers == "object" && !(e.headers instanceof Me || Le.Headers && e.headers instanceof Le.Headers)) {
            var a = [];
            Object.getOwnPropertyNames(e.headers).forEach(function(c) {
                a.push(In(c)), s.setRequestHeader(c, Bc(e.headers[c]));
            }), r.headers.forEach(function(c, h) {
                a.indexOf(h) === -1 && s.setRequestHeader(h, c);
            });
        } else r.headers.forEach(function(c, h) {
            s.setRequestHeader(h, c);
        });
        r.signal && (r.signal.addEventListener("abort", o), s.onreadystatechange = function() {
            s.readyState === 4 && r.signal.removeEventListener("abort", o);
        }), s.send(typeof r._bodyInit > "u" ? null : r._bodyInit);
    });
}
rm.polyfill = !0;
Le.fetch || (Le.fetch = rm, Le.Headers = Me, Le.Request = Gi, Le.Response = $t);
var y1 = self.fetch.bind(self), b1 = H && H.__extends || function() {
    var i = function(e, t) {
        return i = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(n, r) {
            n.__proto__ = r;
        } || function(n, r) {
            for(var s in r)r.hasOwnProperty(s) && (n[s] = r[s]);
        }, i(e, t);
    };
    return function(e, t) {
        i(e, t);
        function n() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n);
    };
}(), v1 = H && H.__awaiter || function(i, e, t, n) {
    function r(s) {
        return s instanceof t ? s : new t(function(o) {
            o(s);
        });
    }
    return new (t || (t = Promise))(function(s, o) {
        function l(h) {
            try {
                c(n.next(h));
            } catch (u) {
                o(u);
            }
        }
        function a(h) {
            try {
                c(n.throw(h));
            } catch (u) {
                o(u);
            }
        }
        function c(h) {
            h.done ? s(h.value) : r(h.value).then(l, a);
        }
        c((n = n.apply(i, e || [])).next());
    });
}, w1 = H && H.__generator || function(i, e) {
    var t = {
        label: 0,
        sent: function() {
            if (s[0] & 1) throw s[1];
            return s[1];
        },
        trys: [],
        ops: []
    }, n, r, s, o;
    return o = {
        next: l(0),
        throw: l(1),
        return: l(2)
    }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
    }), o;
    function l(c) {
        return function(h) {
            return a([
                c,
                h
            ]);
        };
    }
    function a(c) {
        if (n) throw new TypeError("Generator is already executing.");
        for(; t;)try {
            if (n = 1, r && (s = c[0] & 2 ? r.return : c[0] ? r.throw || ((s = r.return) && s.call(r), 0) : r.next) && !(s = s.call(r, c[1])).done) return s;
            switch(r = 0, s && (c = [
                c[0] & 2,
                s.value
            ]), c[0]){
                case 0:
                case 1:
                    s = c;
                    break;
                case 4:
                    return t.label++, {
                        value: c[1],
                        done: !1
                    };
                case 5:
                    t.label++, r = c[1], c = [
                        0
                    ];
                    continue;
                case 7:
                    c = t.ops.pop(), t.trys.pop();
                    continue;
                default:
                    if (s = t.trys, !(s = s.length > 0 && s[s.length - 1]) && (c[0] === 6 || c[0] === 2)) {
                        t = 0;
                        continue;
                    }
                    if (c[0] === 3 && (!s || c[1] > s[0] && c[1] < s[3])) {
                        t.label = c[1];
                        break;
                    }
                    if (c[0] === 6 && t.label < s[1]) {
                        t.label = s[1], s = c;
                        break;
                    }
                    if (s && t.label < s[2]) {
                        t.label = s[2], t.ops.push(c);
                        break;
                    }
                    s[2] && t.ops.pop(), t.trys.pop();
                    continue;
            }
            c = e.call(i, t);
        } catch (h) {
            c = [
                6,
                h
            ], r = 0;
        } finally{
            n = s = 0;
        }
        if (c[0] & 5) throw c[1];
        return {
            value: c[0] ? c[1] : void 0,
            done: !0
        };
    }
}, k1 = H && H.__importDefault || function(i) {
    return i && i.__esModule ? i : {
        default: i
    };
};
Object.defineProperty(Ir, "__esModule", {
    value: !0
});
Ir.HTTPTransport = void 0;
var S1 = k1(y1), C1 = Mi, cl = Bn, xu = Ln, sm = function(i) {
    b1(e, i);
    function e(t, n) {
        var r = i.call(this) || this;
        return r.onlyNotifications = function(s) {
            return s instanceof Array ? s.every(function(o) {
                return o.request.request.id === null || o.request.request.id === void 0;
            }) : s.request.id === null || s.request.id === void 0;
        }, r.uri = t, r.credentials = n && n.credentials, r.headers = e.setupHeaders(n && n.headers), r.injectedFetcher = n == null ? void 0 : n.fetcher, r;
    }
    return e.prototype.connect = function() {
        return Promise.resolve();
    }, e.prototype.sendData = function(t, n) {
        return n === void 0 && (n = null), v1(this, void 0, void 0, function() {
            var r, s, o, l, a, c, u, h, u;
            return w1(this, function(f) {
                switch(f.label){
                    case 0:
                        r = this.transportRequestManager.addRequest(t, n), s = cl.getNotifications(t), o = cl.getBatchRequests(t), l = this.injectedFetcher || S1.default, f.label = 1;
                    case 1:
                        return f.trys.push([
                            1,
                            4,
                            ,
                            5
                        ]), [
                            4,
                            l(this.uri, {
                                method: "POST",
                                headers: this.headers,
                                body: JSON.stringify(this.parseData(t)),
                                credentials: this.credentials
                            })
                        ];
                    case 2:
                        return a = f.sent(), this.transportRequestManager.settlePendingRequest(s), this.onlyNotifications(t) ? [
                            2,
                            Promise.resolve()
                        ] : [
                            4,
                            a.text()
                        ];
                    case 3:
                        return c = f.sent(), u = this.transportRequestManager.resolveResponse(c), u ? (this.transportRequestManager.settlePendingRequest(o, u), [
                            2,
                            Promise.reject(u)
                        ]) : [
                            3,
                            5
                        ];
                    case 4:
                        return h = f.sent(), u = new xu.JSONRPCError(h.message, xu.ERR_UNKNOWN, h), this.transportRequestManager.settlePendingRequest(s, u), this.transportRequestManager.settlePendingRequest(cl.getBatchRequests(t), u), [
                            2,
                            Promise.reject(u)
                        ];
                    case 5:
                        return [
                            2,
                            r
                        ];
                }
            });
        });
    }, e.prototype.close = function() {}, e.setupHeaders = function(t) {
        var n = new Headers(t);
        return n.set("Content-Type", "application/json"), n;
    }, e;
}(C1.Transport);
Ir.HTTPTransport = sm;
Ir.default = sm;
var qc = {}, sn = null;
typeof WebSocket < "u" ? sn = WebSocket : typeof MozWebSocket < "u" ? sn = MozWebSocket : typeof global < "u" ? sn = global.WebSocket || global.MozWebSocket : typeof window < "u" ? sn = window.WebSocket || window.MozWebSocket : typeof self < "u" && (sn = self.WebSocket || self.MozWebSocket);
const T1 = sn, x1 = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: T1
}, Symbol.toStringTag, {
    value: "Module"
})), R1 = zg(x1);
var O1 = H && H.__extends || function() {
    var i = function(e, t) {
        return i = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(n, r) {
            n.__proto__ = r;
        } || function(n, r) {
            for(var s in r)r.hasOwnProperty(s) && (n[s] = r[s]);
        }, i(e, t);
    };
    return function(e, t) {
        i(e, t);
        function n() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n);
    };
}(), D1 = H && H.__awaiter || function(i, e, t, n) {
    function r(s) {
        return s instanceof t ? s : new t(function(o) {
            o(s);
        });
    }
    return new (t || (t = Promise))(function(s, o) {
        function l(h) {
            try {
                c(n.next(h));
            } catch (u) {
                o(u);
            }
        }
        function a(h) {
            try {
                c(n.throw(h));
            } catch (u) {
                o(u);
            }
        }
        function c(h) {
            h.done ? s(h.value) : r(h.value).then(l, a);
        }
        c((n = n.apply(i, e || [])).next());
    });
}, P1 = H && H.__generator || function(i, e) {
    var t = {
        label: 0,
        sent: function() {
            if (s[0] & 1) throw s[1];
            return s[1];
        },
        trys: [],
        ops: []
    }, n, r, s, o;
    return o = {
        next: l(0),
        throw: l(1),
        return: l(2)
    }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
    }), o;
    function l(c) {
        return function(h) {
            return a([
                c,
                h
            ]);
        };
    }
    function a(c) {
        if (n) throw new TypeError("Generator is already executing.");
        for(; t;)try {
            if (n = 1, r && (s = c[0] & 2 ? r.return : c[0] ? r.throw || ((s = r.return) && s.call(r), 0) : r.next) && !(s = s.call(r, c[1])).done) return s;
            switch(r = 0, s && (c = [
                c[0] & 2,
                s.value
            ]), c[0]){
                case 0:
                case 1:
                    s = c;
                    break;
                case 4:
                    return t.label++, {
                        value: c[1],
                        done: !1
                    };
                case 5:
                    t.label++, r = c[1], c = [
                        0
                    ];
                    continue;
                case 7:
                    c = t.ops.pop(), t.trys.pop();
                    continue;
                default:
                    if (s = t.trys, !(s = s.length > 0 && s[s.length - 1]) && (c[0] === 6 || c[0] === 2)) {
                        t = 0;
                        continue;
                    }
                    if (c[0] === 3 && (!s || c[1] > s[0] && c[1] < s[3])) {
                        t.label = c[1];
                        break;
                    }
                    if (c[0] === 6 && t.label < s[1]) {
                        t.label = s[1], s = c;
                        break;
                    }
                    if (s && t.label < s[2]) {
                        t.label = s[2], t.ops.push(c);
                        break;
                    }
                    s[2] && t.ops.pop(), t.trys.pop();
                    continue;
            }
            c = e.call(i, t);
        } catch (h) {
            c = [
                6,
                h
            ], r = 0;
        } finally{
            n = s = 0;
        }
        if (c[0] & 5) throw c[1];
        return {
            value: c[0] ? c[1] : void 0,
            done: !0
        };
    }
}, M1 = H && H.__importDefault || function(i) {
    return i && i.__esModule ? i : {
        default: i
    };
};
Object.defineProperty(qc, "__esModule", {
    value: !0
});
var A1 = M1(R1), _1 = Mi, Ru = Bn, Ou = Ln, E1 = function(i) {
    O1(e, i);
    function e(t) {
        var n = i.call(this) || this;
        return n.uri = t, n.connection = new A1.default(t), n;
    }
    return e.prototype.connect = function() {
        var t = this;
        return new Promise(function(n, r) {
            var s = function() {
                t.connection.removeEventListener("open", s), n();
            };
            t.connection.addEventListener("open", s), t.connection.addEventListener("message", function(o) {
                var l = o.data;
                t.transportRequestManager.resolveResponse(l);
            });
        });
    }, e.prototype.sendData = function(t, n) {
        return n === void 0 && (n = 5e3), D1(this, void 0, void 0, function() {
            var r, s, o;
            return P1(this, function(l) {
                r = this.transportRequestManager.addRequest(t, n), s = Ru.getNotifications(t);
                try {
                    this.connection.send(JSON.stringify(this.parseData(t))), this.transportRequestManager.settlePendingRequest(s);
                } catch (a) {
                    o = new Ou.JSONRPCError(a.message, Ou.ERR_UNKNOWN, a), this.transportRequestManager.settlePendingRequest(s, o), this.transportRequestManager.settlePendingRequest(Ru.getBatchRequests(t), o), r = Promise.reject(o);
                }
                return [
                    2,
                    r
                ];
            });
        });
    }, e.prototype.close = function() {
        this.connection.close();
    }, e;
}(_1.Transport);
qc.default = E1;
var jc = {}, N1 = H && H.__extends || function() {
    var i = function(e, t) {
        return i = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(n, r) {
            n.__proto__ = r;
        } || function(n, r) {
            for(var s in r)r.hasOwnProperty(s) && (n[s] = r[s]);
        }, i(e, t);
    };
    return function(e, t) {
        i(e, t);
        function n() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n);
    };
}(), Du = H && H.__awaiter || function(i, e, t, n) {
    function r(s) {
        return s instanceof t ? s : new t(function(o) {
            o(s);
        });
    }
    return new (t || (t = Promise))(function(s, o) {
        function l(h) {
            try {
                c(n.next(h));
            } catch (u) {
                o(u);
            }
        }
        function a(h) {
            try {
                c(n.throw(h));
            } catch (u) {
                o(u);
            }
        }
        function c(h) {
            h.done ? s(h.value) : r(h.value).then(l, a);
        }
        c((n = n.apply(i, e || [])).next());
    });
}, Pu = H && H.__generator || function(i, e) {
    var t = {
        label: 0,
        sent: function() {
            if (s[0] & 1) throw s[1];
            return s[1];
        },
        trys: [],
        ops: []
    }, n, r, s, o;
    return o = {
        next: l(0),
        throw: l(1),
        return: l(2)
    }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
    }), o;
    function l(c) {
        return function(h) {
            return a([
                c,
                h
            ]);
        };
    }
    function a(c) {
        if (n) throw new TypeError("Generator is already executing.");
        for(; t;)try {
            if (n = 1, r && (s = c[0] & 2 ? r.return : c[0] ? r.throw || ((s = r.return) && s.call(r), 0) : r.next) && !(s = s.call(r, c[1])).done) return s;
            switch(r = 0, s && (c = [
                c[0] & 2,
                s.value
            ]), c[0]){
                case 0:
                case 1:
                    s = c;
                    break;
                case 4:
                    return t.label++, {
                        value: c[1],
                        done: !1
                    };
                case 5:
                    t.label++, r = c[1], c = [
                        0
                    ];
                    continue;
                case 7:
                    c = t.ops.pop(), t.trys.pop();
                    continue;
                default:
                    if (s = t.trys, !(s = s.length > 0 && s[s.length - 1]) && (c[0] === 6 || c[0] === 2)) {
                        t = 0;
                        continue;
                    }
                    if (c[0] === 3 && (!s || c[1] > s[0] && c[1] < s[3])) {
                        t.label = c[1];
                        break;
                    }
                    if (c[0] === 6 && t.label < s[1]) {
                        t.label = s[1], s = c;
                        break;
                    }
                    if (s && t.label < s[2]) {
                        t.label = s[2], t.ops.push(c);
                        break;
                    }
                    s[2] && t.ops.pop(), t.trys.pop();
                    continue;
            }
            c = e.call(i, t);
        } catch (h) {
            c = [
                6,
                h
            ], r = 0;
        } finally{
            n = s = 0;
        }
        if (c[0] & 5) throw c[1];
        return {
            value: c[0] ? c[1] : void 0,
            done: !0
        };
    }
};
Object.defineProperty(jc, "__esModule", {
    value: !0
});
var L1 = Mi, B1 = Bn, I1 = function(i) {
    var e = 400, t = window.screen.height, n = 0, r = 0;
    return window.open(i, "inspector:popup", "left=" + n + ",top=" + r + ",width=" + e + ",height=" + t + ",resizable,scrollbars=yes,status=1");
}, q1 = function(i) {
    N1(e, i);
    function e(t) {
        var n = i.call(this) || this;
        return n.messageHandler = function(r) {
            n.transportRequestManager.resolveResponse(JSON.stringify(r.data));
        }, n.uri = t, n.postMessageID = "post-message-transport-" + Math.random(), n;
    }
    return e.prototype.createWindow = function(t) {
        return new Promise(function(n, r) {
            var s;
            s = I1(t), setTimeout(function() {
                n(s);
            }, 3e3);
        });
    }, e.prototype.connect = function() {
        var t = this, n = /^(http|https):\/\/.*$/;
        return new Promise(function(r, s) {
            return Du(t, void 0, void 0, function() {
                var o;
                return Pu(this, function(l) {
                    switch(l.label){
                        case 0:
                            return n.test(this.uri) || s(new Error("Bad URI")), o = this, [
                                4,
                                this.createWindow(this.uri)
                            ];
                        case 1:
                            return o.frame = l.sent(), window.addEventListener("message", this.messageHandler), r(), [
                                2
                            ];
                    }
                });
            });
        });
    }, e.prototype.sendData = function(t, n) {
        return Du(this, void 0, void 0, function() {
            var r, s;
            return Pu(this, function(o) {
                return r = this.transportRequestManager.addRequest(t, null), s = B1.getNotifications(t), this.frame && (this.frame.postMessage(t.request, this.uri), this.transportRequestManager.settlePendingRequest(s)), [
                    2,
                    r
                ];
            });
        });
    }, e.prototype.close = function() {
        this.frame && (window.removeEventListener("message", this.messageHandler), this.frame.close());
    }, e;
}(L1.Transport);
jc.default = q1;
var Fc = {}, j1 = H && H.__extends || function() {
    var i = function(e, t) {
        return i = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(n, r) {
            n.__proto__ = r;
        } || function(n, r) {
            for(var s in r)r.hasOwnProperty(s) && (n[s] = r[s]);
        }, i(e, t);
    };
    return function(e, t) {
        i(e, t);
        function n() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n);
    };
}(), Mu = H && H.__awaiter || function(i, e, t, n) {
    function r(s) {
        return s instanceof t ? s : new t(function(o) {
            o(s);
        });
    }
    return new (t || (t = Promise))(function(s, o) {
        function l(h) {
            try {
                c(n.next(h));
            } catch (u) {
                o(u);
            }
        }
        function a(h) {
            try {
                c(n.throw(h));
            } catch (u) {
                o(u);
            }
        }
        function c(h) {
            h.done ? s(h.value) : r(h.value).then(l, a);
        }
        c((n = n.apply(i, e || [])).next());
    });
}, Au = H && H.__generator || function(i, e) {
    var t = {
        label: 0,
        sent: function() {
            if (s[0] & 1) throw s[1];
            return s[1];
        },
        trys: [],
        ops: []
    }, n, r, s, o;
    return o = {
        next: l(0),
        throw: l(1),
        return: l(2)
    }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
    }), o;
    function l(c) {
        return function(h) {
            return a([
                c,
                h
            ]);
        };
    }
    function a(c) {
        if (n) throw new TypeError("Generator is already executing.");
        for(; t;)try {
            if (n = 1, r && (s = c[0] & 2 ? r.return : c[0] ? r.throw || ((s = r.return) && s.call(r), 0) : r.next) && !(s = s.call(r, c[1])).done) return s;
            switch(r = 0, s && (c = [
                c[0] & 2,
                s.value
            ]), c[0]){
                case 0:
                case 1:
                    s = c;
                    break;
                case 4:
                    return t.label++, {
                        value: c[1],
                        done: !1
                    };
                case 5:
                    t.label++, r = c[1], c = [
                        0
                    ];
                    continue;
                case 7:
                    c = t.ops.pop(), t.trys.pop();
                    continue;
                default:
                    if (s = t.trys, !(s = s.length > 0 && s[s.length - 1]) && (c[0] === 6 || c[0] === 2)) {
                        t = 0;
                        continue;
                    }
                    if (c[0] === 3 && (!s || c[1] > s[0] && c[1] < s[3])) {
                        t.label = c[1];
                        break;
                    }
                    if (c[0] === 6 && t.label < s[1]) {
                        t.label = s[1], s = c;
                        break;
                    }
                    if (s && t.label < s[2]) {
                        t.label = s[2], t.ops.push(c);
                        break;
                    }
                    s[2] && t.ops.pop(), t.trys.pop();
                    continue;
            }
            c = e.call(i, t);
        } catch (h) {
            c = [
                6,
                h
            ], r = 0;
        } finally{
            n = s = 0;
        }
        if (c[0] & 5) throw c[1];
        return {
            value: c[0] ? c[1] : void 0,
            done: !0
        };
    }
};
Object.defineProperty(Fc, "__esModule", {
    value: !0
});
var F1 = Mi, H1 = Bn, W1 = function(i) {
    j1(e, i);
    function e(t) {
        var n = i.call(this) || this;
        return n.messageHandler = function(r) {
            n.transportRequestManager.resolveResponse(JSON.stringify(r.data));
        }, n.uri = t, n.postMessageID = "post-message-transport-" + Math.random(), n;
    }
    return e.prototype.createWindow = function(t) {
        var n = this;
        return new Promise(function(r, s) {
            var o, l = document.createElement("iframe");
            l.setAttribute("id", n.postMessageID), l.setAttribute("width", "0px"), l.setAttribute("height", "0px"), l.setAttribute("style", "visiblity:hidden;border:none;outline:none;"), l.addEventListener("load", function() {
                r(o);
            }), l.setAttribute("src", t), window.document.body.appendChild(l), o = l.contentWindow;
        });
    }, e.prototype.connect = function() {
        var t = this, n = /^(http|https):\/\/.*$/;
        return new Promise(function(r, s) {
            return Mu(t, void 0, void 0, function() {
                var o;
                return Au(this, function(l) {
                    switch(l.label){
                        case 0:
                            return n.test(this.uri) || s(new Error("Bad URI")), o = this, [
                                4,
                                this.createWindow(this.uri)
                            ];
                        case 1:
                            return o.frame = l.sent(), window.addEventListener("message", this.messageHandler), r(), [
                                2
                            ];
                    }
                });
            });
        });
    }, e.prototype.sendData = function(t, n) {
        return Mu(this, void 0, void 0, function() {
            var r, s;
            return Au(this, function(o) {
                return r = this.transportRequestManager.addRequest(t, null), s = H1.getNotifications(t), this.frame && (this.frame.postMessage(t.request, "*"), this.transportRequestManager.settlePendingRequest(s)), [
                    2,
                    r
                ];
            });
        });
    }, e.prototype.close = function() {
        var t = document.getElementById(this.postMessageID);
        t == null || t.remove(), window.removeEventListener("message", this.messageHandler);
    }, e;
}(F1.Transport);
Fc.default = W1;
var Hc = {}, _u = H && H.__awaiter || function(i, e, t, n) {
    function r(s) {
        return s instanceof t ? s : new t(function(o) {
            o(s);
        });
    }
    return new (t || (t = Promise))(function(s, o) {
        function l(h) {
            try {
                c(n.next(h));
            } catch (u) {
                o(u);
            }
        }
        function a(h) {
            try {
                c(n.throw(h));
            } catch (u) {
                o(u);
            }
        }
        function c(h) {
            h.done ? s(h.value) : r(h.value).then(l, a);
        }
        c((n = n.apply(i, e || [])).next());
    });
}, Eu = H && H.__generator || function(i, e) {
    var t = {
        label: 0,
        sent: function() {
            if (s[0] & 1) throw s[1];
            return s[1];
        },
        trys: [],
        ops: []
    }, n, r, s, o;
    return o = {
        next: l(0),
        throw: l(1),
        return: l(2)
    }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
    }), o;
    function l(c) {
        return function(h) {
            return a([
                c,
                h
            ]);
        };
    }
    function a(c) {
        if (n) throw new TypeError("Generator is already executing.");
        for(; t;)try {
            if (n = 1, r && (s = c[0] & 2 ? r.return : c[0] ? r.throw || ((s = r.return) && s.call(r), 0) : r.next) && !(s = s.call(r, c[1])).done) return s;
            switch(r = 0, s && (c = [
                c[0] & 2,
                s.value
            ]), c[0]){
                case 0:
                case 1:
                    s = c;
                    break;
                case 4:
                    return t.label++, {
                        value: c[1],
                        done: !1
                    };
                case 5:
                    t.label++, r = c[1], c = [
                        0
                    ];
                    continue;
                case 7:
                    c = t.ops.pop(), t.trys.pop();
                    continue;
                default:
                    if (s = t.trys, !(s = s.length > 0 && s[s.length - 1]) && (c[0] === 6 || c[0] === 2)) {
                        t = 0;
                        continue;
                    }
                    if (c[0] === 3 && (!s || c[1] > s[0] && c[1] < s[3])) {
                        t.label = c[1];
                        break;
                    }
                    if (c[0] === 6 && t.label < s[1]) {
                        t.label = s[1], s = c;
                        break;
                    }
                    if (s && t.label < s[2]) {
                        t.label = s[2], t.ops.push(c);
                        break;
                    }
                    s[2] && t.ops.pop(), t.trys.pop();
                    continue;
            }
            c = e.call(i, t);
        } catch (h) {
            c = [
                6,
                h
            ], r = 0;
        } finally{
            n = s = 0;
        }
        if (c[0] & 5) throw c[1];
        return {
            value: c[0] ? c[1] : void 0,
            done: !0
        };
    }
};
Object.defineProperty(Hc, "__esModule", {
    value: !0
});
var V1 = function() {
    function i(e) {
        this.requestManager = e;
    }
    return i.prototype.startBatch = function() {
        return this.requestManager.startBatch();
    }, i.prototype.stopBatch = function() {
        return this.requestManager.stopBatch();
    }, i.prototype.request = function(e, t) {
        return _u(this, void 0, void 0, function() {
            return Eu(this, function(n) {
                switch(n.label){
                    case 0:
                        return this.requestManager.connectPromise ? [
                            4,
                            this.requestManager.connectPromise
                        ] : [
                            3,
                            2
                        ];
                    case 1:
                        n.sent(), n.label = 2;
                    case 2:
                        return [
                            2,
                            this.requestManager.request(e, !1, t)
                        ];
                }
            });
        });
    }, i.prototype.notify = function(e) {
        return _u(this, void 0, void 0, function() {
            return Eu(this, function(t) {
                switch(t.label){
                    case 0:
                        return this.requestManager.connectPromise ? [
                            4,
                            this.requestManager.connectPromise
                        ] : [
                            3,
                            2
                        ];
                    case 1:
                        t.sent(), t.label = 2;
                    case 2:
                        return [
                            2,
                            this.requestManager.request(e, !0, null)
                        ];
                }
            });
        });
    }, i.prototype.onNotification = function(e) {
        this.requestManager.requestChannel.addListener("notification", e);
    }, i.prototype.onError = function(e) {
        this.requestManager.requestChannel.addListener("error", e);
    }, i.prototype.close = function() {
        this.requestManager.close();
    }, i;
}();
Hc.default = V1;
(function(i) {
    var e = H && H.__importDefault || function(h) {
        return h && h.__esModule ? h : {
            default: h
        };
    };
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.PostMessageIframeTransport = i.PostMessageWindowTransport = i.JSONRPCError = i.WebSocketTransport = i.EventEmitterTransport = i.HTTPTransport = i.RequestManager = i.Client = void 0;
    var t = e(Ug);
    i.RequestManager = t.default;
    var n = e(Lc);
    i.EventEmitterTransport = n.default;
    var r = e(Ir);
    i.HTTPTransport = r.default;
    var s = e(qc);
    i.WebSocketTransport = s.default;
    var o = e(jc);
    i.PostMessageWindowTransport = o.default;
    var l = e(Fc);
    i.PostMessageIframeTransport = l.default;
    var a = Ln;
    Object.defineProperty(i, "JSONRPCError", {
        enumerable: !0,
        get: function() {
            return a.JSONRPCError;
        }
    });
    var c = e(Hc);
    i.Client = c.default, i.default = c.default;
})(io);
var ti = {}, Yi = {}, Wc = {}, hl = {}, F = {}, _e = {}, Nu;
function qr() {
    if (Nu) return _e;
    Nu = 1, Object.defineProperty(_e, "__esModule", {
        value: !0
    }), _e.stringArray = _e.array = _e.func = _e.error = _e.number = _e.string = _e.boolean = void 0;
    function i(l) {
        return l === !0 || l === !1;
    }
    _e.boolean = i;
    function e(l) {
        return typeof l == "string" || l instanceof String;
    }
    _e.string = e;
    function t(l) {
        return typeof l == "number" || l instanceof Number;
    }
    _e.number = t;
    function n(l) {
        return l instanceof Error;
    }
    _e.error = n;
    function r(l) {
        return typeof l == "function";
    }
    _e.func = r;
    function s(l) {
        return Array.isArray(l);
    }
    _e.array = s;
    function o(l) {
        return s(l) && l.every((a)=>e(a));
    }
    return _e.stringArray = o, _e;
}
var Lu;
function om() {
    if (Lu) return F;
    Lu = 1, Object.defineProperty(F, "__esModule", {
        value: !0
    }), F.Message = F.NotificationType9 = F.NotificationType8 = F.NotificationType7 = F.NotificationType6 = F.NotificationType5 = F.NotificationType4 = F.NotificationType3 = F.NotificationType2 = F.NotificationType1 = F.NotificationType0 = F.NotificationType = F.RequestType9 = F.RequestType8 = F.RequestType7 = F.RequestType6 = F.RequestType5 = F.RequestType4 = F.RequestType3 = F.RequestType2 = F.RequestType1 = F.RequestType = F.RequestType0 = F.AbstractMessageSignature = F.ParameterStructures = F.ResponseError = F.ErrorCodes = void 0;
    const i = qr();
    var e;
    (function(L) {
        L.ParseError = -32700, L.InvalidRequest = -32600, L.MethodNotFound = -32601, L.InvalidParams = -32602, L.InternalError = -32603, L.jsonrpcReservedErrorRangeStart = -32099, L.serverErrorStart = -32099, L.MessageWriteError = -32099, L.MessageReadError = -32098, L.PendingResponseRejected = -32097, L.ConnectionInactive = -32096, L.ServerNotInitialized = -32002, L.UnknownErrorCode = -32001, L.jsonrpcReservedErrorRangeEnd = -32000, L.serverErrorEnd = -32000;
    })(e || (F.ErrorCodes = e = {}));
    class t extends Error {
        constructor(v, N, B){
            super(N), this.code = i.number(v) ? v : e.UnknownErrorCode, this.data = B, Object.setPrototypeOf(this, t.prototype);
        }
        toJson() {
            const v = {
                code: this.code,
                message: this.message
            };
            return this.data !== void 0 && (v.data = this.data), v;
        }
    }
    F.ResponseError = t;
    class n {
        constructor(v){
            this.kind = v;
        }
        static is(v) {
            return v === n.auto || v === n.byName || v === n.byPosition;
        }
        toString() {
            return this.kind;
        }
    }
    F.ParameterStructures = n, n.auto = new n("auto"), n.byPosition = new n("byPosition"), n.byName = new n("byName");
    class r {
        constructor(v, N){
            this.method = v, this.numberOfParams = N;
        }
        get parameterStructures() {
            return n.auto;
        }
    }
    F.AbstractMessageSignature = r;
    class s extends r {
        constructor(v){
            super(v, 0);
        }
    }
    F.RequestType0 = s;
    class o extends r {
        constructor(v, N = n.auto){
            super(v, 1), this._parameterStructures = N;
        }
        get parameterStructures() {
            return this._parameterStructures;
        }
    }
    F.RequestType = o;
    class l extends r {
        constructor(v, N = n.auto){
            super(v, 1), this._parameterStructures = N;
        }
        get parameterStructures() {
            return this._parameterStructures;
        }
    }
    F.RequestType1 = l;
    class a extends r {
        constructor(v){
            super(v, 2);
        }
    }
    F.RequestType2 = a;
    class c extends r {
        constructor(v){
            super(v, 3);
        }
    }
    F.RequestType3 = c;
    class h extends r {
        constructor(v){
            super(v, 4);
        }
    }
    F.RequestType4 = h;
    class u extends r {
        constructor(v){
            super(v, 5);
        }
    }
    F.RequestType5 = u;
    class f extends r {
        constructor(v){
            super(v, 6);
        }
    }
    F.RequestType6 = f;
    class d extends r {
        constructor(v){
            super(v, 7);
        }
    }
    F.RequestType7 = d;
    class p extends r {
        constructor(v){
            super(v, 8);
        }
    }
    F.RequestType8 = p;
    class y extends r {
        constructor(v){
            super(v, 9);
        }
    }
    F.RequestType9 = y;
    class b extends r {
        constructor(v, N = n.auto){
            super(v, 1), this._parameterStructures = N;
        }
        get parameterStructures() {
            return this._parameterStructures;
        }
    }
    F.NotificationType = b;
    class k extends r {
        constructor(v){
            super(v, 0);
        }
    }
    F.NotificationType0 = k;
    class T extends r {
        constructor(v, N = n.auto){
            super(v, 1), this._parameterStructures = N;
        }
        get parameterStructures() {
            return this._parameterStructures;
        }
    }
    F.NotificationType1 = T;
    class D extends r {
        constructor(v){
            super(v, 2);
        }
    }
    F.NotificationType2 = D;
    class S extends r {
        constructor(v){
            super(v, 3);
        }
    }
    F.NotificationType3 = S;
    class x extends r {
        constructor(v){
            super(v, 4);
        }
    }
    F.NotificationType4 = x;
    class R extends r {
        constructor(v){
            super(v, 5);
        }
    }
    F.NotificationType5 = R;
    class E extends r {
        constructor(v){
            super(v, 6);
        }
    }
    F.NotificationType6 = E;
    class K extends r {
        constructor(v){
            super(v, 7);
        }
    }
    F.NotificationType7 = K;
    class W extends r {
        constructor(v){
            super(v, 8);
        }
    }
    F.NotificationType8 = W;
    class U extends r {
        constructor(v){
            super(v, 9);
        }
    }
    F.NotificationType9 = U;
    var G;
    return function(L) {
        function v(_) {
            const V = _;
            return V && i.string(V.method) && (i.string(V.id) || i.number(V.id));
        }
        L.isRequest = v;
        function N(_) {
            const V = _;
            return V && i.string(V.method) && _.id === void 0;
        }
        L.isNotification = N;
        function B(_) {
            const V = _;
            return V && (V.result !== void 0 || !!V.error) && (i.string(V.id) || i.number(V.id) || V.id === null);
        }
        L.isResponse = B;
    }(G || (F.Message = G = {})), F;
}
var Jt = {}, Bu;
function lm() {
    if (Bu) return Jt;
    Bu = 1;
    var i;
    Object.defineProperty(Jt, "__esModule", {
        value: !0
    }), Jt.LRUCache = Jt.LinkedMap = Jt.Touch = void 0;
    var e;
    (function(r) {
        r.None = 0, r.First = 1, r.AsOld = r.First, r.Last = 2, r.AsNew = r.Last;
    })(e || (Jt.Touch = e = {}));
    class t {
        constructor(){
            this[i] = "LinkedMap", this._map = new Map, this._head = void 0, this._tail = void 0, this._size = 0, this._state = 0;
        }
        clear() {
            this._map.clear(), this._head = void 0, this._tail = void 0, this._size = 0, this._state++;
        }
        isEmpty() {
            return !this._head && !this._tail;
        }
        get size() {
            return this._size;
        }
        get first() {
            var s;
            return (s = this._head) == null ? void 0 : s.value;
        }
        get last() {
            var s;
            return (s = this._tail) == null ? void 0 : s.value;
        }
        has(s) {
            return this._map.has(s);
        }
        get(s, o = e.None) {
            const l = this._map.get(s);
            if (l) return o !== e.None && this.touch(l, o), l.value;
        }
        set(s, o, l = e.None) {
            let a = this._map.get(s);
            if (a) a.value = o, l !== e.None && this.touch(a, l);
            else {
                switch(a = {
                    key: s,
                    value: o,
                    next: void 0,
                    previous: void 0
                }, l){
                    case e.None:
                        this.addItemLast(a);
                        break;
                    case e.First:
                        this.addItemFirst(a);
                        break;
                    case e.Last:
                        this.addItemLast(a);
                        break;
                    default:
                        this.addItemLast(a);
                        break;
                }
                this._map.set(s, a), this._size++;
            }
            return this;
        }
        delete(s) {
            return !!this.remove(s);
        }
        remove(s) {
            const o = this._map.get(s);
            if (o) return this._map.delete(s), this.removeItem(o), this._size--, o.value;
        }
        shift() {
            if (!this._head && !this._tail) return;
            if (!this._head || !this._tail) throw new Error("Invalid list");
            const s = this._head;
            return this._map.delete(s.key), this.removeItem(s), this._size--, s.value;
        }
        forEach(s, o) {
            const l = this._state;
            let a = this._head;
            for(; a;){
                if (o ? s.bind(o)(a.value, a.key, this) : s(a.value, a.key, this), this._state !== l) throw new Error("LinkedMap got modified during iteration.");
                a = a.next;
            }
        }
        keys() {
            const s = this._state;
            let o = this._head;
            const l = {
                [Symbol.iterator]: ()=>l,
                next: ()=>{
                    if (this._state !== s) throw new Error("LinkedMap got modified during iteration.");
                    if (o) {
                        const a = {
                            value: o.key,
                            done: !1
                        };
                        return o = o.next, a;
                    } else return {
                        value: void 0,
                        done: !0
                    };
                }
            };
            return l;
        }
        values() {
            const s = this._state;
            let o = this._head;
            const l = {
                [Symbol.iterator]: ()=>l,
                next: ()=>{
                    if (this._state !== s) throw new Error("LinkedMap got modified during iteration.");
                    if (o) {
                        const a = {
                            value: o.value,
                            done: !1
                        };
                        return o = o.next, a;
                    } else return {
                        value: void 0,
                        done: !0
                    };
                }
            };
            return l;
        }
        entries() {
            const s = this._state;
            let o = this._head;
            const l = {
                [Symbol.iterator]: ()=>l,
                next: ()=>{
                    if (this._state !== s) throw new Error("LinkedMap got modified during iteration.");
                    if (o) {
                        const a = {
                            value: [
                                o.key,
                                o.value
                            ],
                            done: !1
                        };
                        return o = o.next, a;
                    } else return {
                        value: void 0,
                        done: !0
                    };
                }
            };
            return l;
        }
        [(i = Symbol.toStringTag, Symbol.iterator)]() {
            return this.entries();
        }
        trimOld(s) {
            if (s >= this.size) return;
            if (s === 0) {
                this.clear();
                return;
            }
            let o = this._head, l = this.size;
            for(; o && l > s;)this._map.delete(o.key), o = o.next, l--;
            this._head = o, this._size = l, o && (o.previous = void 0), this._state++;
        }
        addItemFirst(s) {
            if (!this._head && !this._tail) this._tail = s;
            else if (this._head) s.next = this._head, this._head.previous = s;
            else throw new Error("Invalid list");
            this._head = s, this._state++;
        }
        addItemLast(s) {
            if (!this._head && !this._tail) this._head = s;
            else if (this._tail) s.previous = this._tail, this._tail.next = s;
            else throw new Error("Invalid list");
            this._tail = s, this._state++;
        }
        removeItem(s) {
            if (s === this._head && s === this._tail) this._head = void 0, this._tail = void 0;
            else if (s === this._head) {
                if (!s.next) throw new Error("Invalid list");
                s.next.previous = void 0, this._head = s.next;
            } else if (s === this._tail) {
                if (!s.previous) throw new Error("Invalid list");
                s.previous.next = void 0, this._tail = s.previous;
            } else {
                const o = s.next, l = s.previous;
                if (!o || !l) throw new Error("Invalid list");
                o.previous = l, l.next = o;
            }
            s.next = void 0, s.previous = void 0, this._state++;
        }
        touch(s, o) {
            if (!this._head || !this._tail) throw new Error("Invalid list");
            if (!(o !== e.First && o !== e.Last)) {
                if (o === e.First) {
                    if (s === this._head) return;
                    const l = s.next, a = s.previous;
                    s === this._tail ? (a.next = void 0, this._tail = a) : (l.previous = a, a.next = l), s.previous = void 0, s.next = this._head, this._head.previous = s, this._head = s, this._state++;
                } else if (o === e.Last) {
                    if (s === this._tail) return;
                    const l = s.next, a = s.previous;
                    s === this._head ? (l.previous = void 0, this._head = l) : (l.previous = a, a.next = l), s.next = void 0, s.previous = this._tail, this._tail.next = s, this._tail = s, this._state++;
                }
            }
        }
        toJSON() {
            const s = [];
            return this.forEach((o, l)=>{
                s.push([
                    l,
                    o
                ]);
            }), s;
        }
        fromJSON(s) {
            this.clear();
            for (const [o, l] of s)this.set(o, l);
        }
    }
    Jt.LinkedMap = t;
    class n extends t {
        constructor(s, o = 1){
            super(), this._limit = s, this._ratio = Math.min(Math.max(0, o), 1);
        }
        get limit() {
            return this._limit;
        }
        set limit(s) {
            this._limit = s, this.checkTrim();
        }
        get ratio() {
            return this._ratio;
        }
        set ratio(s) {
            this._ratio = Math.min(Math.max(0, s), 1), this.checkTrim();
        }
        get(s, o = e.AsNew) {
            return super.get(s, o);
        }
        peek(s) {
            return super.get(s, e.None);
        }
        set(s, o) {
            return super.set(s, o, e.Last), this.checkTrim(), this;
        }
        checkTrim() {
            this.size > this._limit && this.trimOld(Math.round(this._limit * this._ratio));
        }
    }
    return Jt.LRUCache = n, Jt;
}
var tr = {}, Iu;
function $1() {
    if (Iu) return tr;
    Iu = 1, Object.defineProperty(tr, "__esModule", {
        value: !0
    }), tr.Disposable = void 0;
    var i;
    return function(e) {
        function t(n) {
            return {
                dispose: n
            };
        }
        e.create = t;
    }(i || (tr.Disposable = i = {})), tr;
}
var Bi = {}, Cs = {}, qu;
function Xi() {
    if (qu) return Cs;
    qu = 1, Object.defineProperty(Cs, "__esModule", {
        value: !0
    });
    let i;
    function e() {
        if (i === void 0) throw new Error("No runtime abstraction layer installed");
        return i;
    }
    return function(t) {
        function n(r) {
            if (r === void 0) throw new Error("No runtime abstraction layer provided");
            i = r;
        }
        t.install = n;
    }(e || (e = {})), Cs.default = e, Cs;
}
var ju;
function jr() {
    if (ju) return Bi;
    ju = 1, Object.defineProperty(Bi, "__esModule", {
        value: !0
    }), Bi.Emitter = Bi.Event = void 0;
    const i = Xi();
    var e;
    (function(r) {
        const s = {
            dispose () {}
        };
        r.None = function() {
            return s;
        };
    })(e || (Bi.Event = e = {}));
    class t {
        add(s, o = null, l) {
            this._callbacks || (this._callbacks = [], this._contexts = []), this._callbacks.push(s), this._contexts.push(o), Array.isArray(l) && l.push({
                dispose: ()=>this.remove(s, o)
            });
        }
        remove(s, o = null) {
            if (!this._callbacks) return;
            let l = !1;
            for(let a = 0, c = this._callbacks.length; a < c; a++)if (this._callbacks[a] === s) {
                if (this._contexts[a] === o) {
                    this._callbacks.splice(a, 1), this._contexts.splice(a, 1);
                    return;
                } else l = !0;
            }
            if (l) throw new Error("When adding a listener with a context, you should remove it with the same context");
        }
        invoke(...s) {
            if (!this._callbacks) return [];
            const o = [], l = this._callbacks.slice(0), a = this._contexts.slice(0);
            for(let c = 0, h = l.length; c < h; c++)try {
                o.push(l[c].apply(a[c], s));
            } catch (u) {
                (0, i.default)().console.error(u);
            }
            return o;
        }
        isEmpty() {
            return !this._callbacks || this._callbacks.length === 0;
        }
        dispose() {
            this._callbacks = void 0, this._contexts = void 0;
        }
    }
    class n {
        constructor(s){
            this._options = s;
        }
        get event() {
            return this._event || (this._event = (s, o, l)=>{
                this._callbacks || (this._callbacks = new t), this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty() && this._options.onFirstListenerAdd(this), this._callbacks.add(s, o);
                const a = {
                    dispose: ()=>{
                        this._callbacks && (this._callbacks.remove(s, o), a.dispose = n._noop, this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty() && this._options.onLastListenerRemove(this));
                    }
                };
                return Array.isArray(l) && l.push(a), a;
            }), this._event;
        }
        fire(s) {
            this._callbacks && this._callbacks.invoke.call(this._callbacks, s);
        }
        dispose() {
            this._callbacks && (this._callbacks.dispose(), this._callbacks = void 0);
        }
    }
    return Bi.Emitter = n, n._noop = function() {}, Bi;
}
var Ii = {}, Fu;
function Vc() {
    if (Fu) return Ii;
    Fu = 1, Object.defineProperty(Ii, "__esModule", {
        value: !0
    }), Ii.CancellationTokenSource = Ii.CancellationToken = void 0;
    const i = Xi(), e = qr(), t = jr();
    var n;
    (function(l) {
        l.None = Object.freeze({
            isCancellationRequested: !1,
            onCancellationRequested: t.Event.None
        }), l.Cancelled = Object.freeze({
            isCancellationRequested: !0,
            onCancellationRequested: t.Event.None
        });
        function a(c) {
            const h = c;
            return h && (h === l.None || h === l.Cancelled || e.boolean(h.isCancellationRequested) && !!h.onCancellationRequested);
        }
        l.is = a;
    })(n || (Ii.CancellationToken = n = {}));
    const r = Object.freeze(function(l, a) {
        const c = (0, i.default)().timer.setTimeout(l.bind(a), 0);
        return {
            dispose () {
                c.dispose();
            }
        };
    });
    class s {
        constructor(){
            this._isCancelled = !1;
        }
        cancel() {
            this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
        }
        get isCancellationRequested() {
            return this._isCancelled;
        }
        get onCancellationRequested() {
            return this._isCancelled ? r : (this._emitter || (this._emitter = new t.Emitter), this._emitter.event);
        }
        dispose() {
            this._emitter && (this._emitter.dispose(), this._emitter = void 0);
        }
    }
    class o {
        get token() {
            return this._token || (this._token = new s), this._token;
        }
        cancel() {
            this._token ? this._token.cancel() : this._token = n.Cancelled;
        }
        dispose() {
            this._token ? this._token instanceof s && this._token.dispose() : this._token = n.None;
        }
    }
    return Ii.CancellationTokenSource = o, Ii;
}
var qi = {}, Hu;
function z1() {
    if (Hu) return qi;
    Hu = 1, Object.defineProperty(qi, "__esModule", {
        value: !0
    }), qi.SharedArrayReceiverStrategy = qi.SharedArraySenderStrategy = void 0;
    const i = Vc();
    var e;
    (function(o) {
        o.Continue = 0, o.Cancelled = 1;
    })(e || (e = {}));
    class t {
        constructor(){
            this.buffers = new Map;
        }
        enableCancellation(l) {
            if (l.id === null) return;
            const a = new SharedArrayBuffer(4), c = new Int32Array(a, 0, 1);
            c[0] = e.Continue, this.buffers.set(l.id, a), l.$cancellationData = a;
        }
        async sendCancellation(l, a) {
            const c = this.buffers.get(a);
            if (c === void 0) return;
            const h = new Int32Array(c, 0, 1);
            Atomics.store(h, 0, e.Cancelled);
        }
        cleanup(l) {
            this.buffers.delete(l);
        }
        dispose() {
            this.buffers.clear();
        }
    }
    qi.SharedArraySenderStrategy = t;
    class n {
        constructor(l){
            this.data = new Int32Array(l, 0, 1);
        }
        get isCancellationRequested() {
            return Atomics.load(this.data, 0) === e.Cancelled;
        }
        get onCancellationRequested() {
            throw new Error("Cancellation over SharedArrayBuffer doesn't support cancellation events");
        }
    }
    class r {
        constructor(l){
            this.token = new n(l);
        }
        cancel() {}
        dispose() {}
    }
    class s {
        constructor(){
            this.kind = "request";
        }
        createCancellationTokenSource(l) {
            const a = l.$cancellationData;
            return a === void 0 ? new i.CancellationTokenSource : new r(a);
        }
    }
    return qi.SharedArrayReceiverStrategy = s, qi;
}
var Qt = {}, ir = {}, Wu;
function am() {
    if (Wu) return ir;
    Wu = 1, Object.defineProperty(ir, "__esModule", {
        value: !0
    }), ir.Semaphore = void 0;
    const i = Xi();
    class e {
        constructor(n = 1){
            if (n <= 0) throw new Error("Capacity must be greater than 0");
            this._capacity = n, this._active = 0, this._waiting = [];
        }
        lock(n) {
            return new Promise((r, s)=>{
                this._waiting.push({
                    thunk: n,
                    resolve: r,
                    reject: s
                }), this.runNext();
            });
        }
        get active() {
            return this._active;
        }
        runNext() {
            this._waiting.length === 0 || this._active === this._capacity || (0, i.default)().timer.setImmediate(()=>this.doRunNext());
        }
        doRunNext() {
            if (this._waiting.length === 0 || this._active === this._capacity) return;
            const n = this._waiting.shift();
            if (this._active++, this._active > this._capacity) throw new Error("To many thunks active");
            try {
                const r = n.thunk();
                r instanceof Promise ? r.then((s)=>{
                    this._active--, n.resolve(s), this.runNext();
                }, (s)=>{
                    this._active--, n.reject(s), this.runNext();
                }) : (this._active--, n.resolve(r), this.runNext());
            } catch (r) {
                this._active--, n.reject(r), this.runNext();
            }
        }
    }
    return ir.Semaphore = e, ir;
}
var Vu;
function U1() {
    if (Vu) return Qt;
    Vu = 1, Object.defineProperty(Qt, "__esModule", {
        value: !0
    }), Qt.ReadableStreamMessageReader = Qt.AbstractMessageReader = Qt.MessageReader = void 0;
    const i = Xi(), e = qr(), t = jr(), n = am();
    var r;
    (function(a) {
        function c(h) {
            let u = h;
            return u && e.func(u.listen) && e.func(u.dispose) && e.func(u.onError) && e.func(u.onClose) && e.func(u.onPartialMessage);
        }
        a.is = c;
    })(r || (Qt.MessageReader = r = {}));
    class s {
        constructor(){
            this.errorEmitter = new t.Emitter, this.closeEmitter = new t.Emitter, this.partialMessageEmitter = new t.Emitter;
        }
        dispose() {
            this.errorEmitter.dispose(), this.closeEmitter.dispose();
        }
        get onError() {
            return this.errorEmitter.event;
        }
        fireError(c) {
            this.errorEmitter.fire(this.asError(c));
        }
        get onClose() {
            return this.closeEmitter.event;
        }
        fireClose() {
            this.closeEmitter.fire(void 0);
        }
        get onPartialMessage() {
            return this.partialMessageEmitter.event;
        }
        firePartialMessage(c) {
            this.partialMessageEmitter.fire(c);
        }
        asError(c) {
            return c instanceof Error ? c : new Error(`Reader received error. Reason: ${e.string(c.message) ? c.message : "unknown"}`);
        }
    }
    Qt.AbstractMessageReader = s;
    var o;
    (function(a) {
        function c(h) {
            let u, f;
            const d = new Map;
            let p;
            const y = new Map;
            if (h === void 0 || typeof h == "string") u = h ?? "utf-8";
            else {
                if (u = h.charset ?? "utf-8", h.contentDecoder !== void 0 && (f = h.contentDecoder, d.set(f.name, f)), h.contentDecoders !== void 0) for (const b of h.contentDecoders)d.set(b.name, b);
                if (h.contentTypeDecoder !== void 0 && (p = h.contentTypeDecoder, y.set(p.name, p)), h.contentTypeDecoders !== void 0) for (const b of h.contentTypeDecoders)y.set(b.name, b);
            }
            return p === void 0 && (p = (0, i.default)().applicationJson.decoder, y.set(p.name, p)), {
                charset: u,
                contentDecoder: f,
                contentDecoders: d,
                contentTypeDecoder: p,
                contentTypeDecoders: y
            };
        }
        a.fromOptions = c;
    })(o || (o = {}));
    class l extends s {
        constructor(c, h){
            super(), this.readable = c, this.options = o.fromOptions(h), this.buffer = (0, i.default)().messageBuffer.create(this.options.charset), this._partialMessageTimeout = 1e4, this.nextMessageLength = -1, this.messageToken = 0, this.readSemaphore = new n.Semaphore(1);
        }
        set partialMessageTimeout(c) {
            this._partialMessageTimeout = c;
        }
        get partialMessageTimeout() {
            return this._partialMessageTimeout;
        }
        listen(c) {
            this.nextMessageLength = -1, this.messageToken = 0, this.partialMessageTimer = void 0, this.callback = c;
            const h = this.readable.onData((u)=>{
                this.onData(u);
            });
            return this.readable.onError((u)=>this.fireError(u)), this.readable.onClose(()=>this.fireClose()), h;
        }
        onData(c) {
            try {
                for(this.buffer.append(c);;){
                    if (this.nextMessageLength === -1) {
                        const u = this.buffer.tryReadHeaders(!0);
                        if (!u) return;
                        const f = u.get("content-length");
                        if (!f) {
                            this.fireError(new Error(`Header must provide a Content-Length property.
${JSON.stringify(Object.fromEntries(u))}`));
                            return;
                        }
                        const d = parseInt(f);
                        if (isNaN(d)) {
                            this.fireError(new Error(`Content-Length value must be a number. Got ${f}`));
                            return;
                        }
                        this.nextMessageLength = d;
                    }
                    const h = this.buffer.tryReadBody(this.nextMessageLength);
                    if (h === void 0) {
                        this.setPartialMessageTimer();
                        return;
                    }
                    this.clearPartialMessageTimer(), this.nextMessageLength = -1, this.readSemaphore.lock(async ()=>{
                        const u = this.options.contentDecoder !== void 0 ? await this.options.contentDecoder.decode(h) : h, f = await this.options.contentTypeDecoder.decode(u, this.options);
                        this.callback(f);
                    }).catch((u)=>{
                        this.fireError(u);
                    });
                }
            } catch (h) {
                this.fireError(h);
            }
        }
        clearPartialMessageTimer() {
            this.partialMessageTimer && (this.partialMessageTimer.dispose(), this.partialMessageTimer = void 0);
        }
        setPartialMessageTimer() {
            this.clearPartialMessageTimer(), !(this._partialMessageTimeout <= 0) && (this.partialMessageTimer = (0, i.default)().timer.setTimeout((c, h)=>{
                this.partialMessageTimer = void 0, c === this.messageToken && (this.firePartialMessage({
                    messageToken: c,
                    waitingTime: h
                }), this.setPartialMessageTimer());
            }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout));
        }
    }
    return Qt.ReadableStreamMessageReader = l, Qt;
}
var Yt = {}, $u;
function K1() {
    if ($u) return Yt;
    $u = 1, Object.defineProperty(Yt, "__esModule", {
        value: !0
    }), Yt.WriteableStreamMessageWriter = Yt.AbstractMessageWriter = Yt.MessageWriter = void 0;
    const i = Xi(), e = qr(), t = am(), n = jr(), r = "Content-Length: ", s = `\r
`;
    var o;
    (function(h) {
        function u(f) {
            let d = f;
            return d && e.func(d.dispose) && e.func(d.onClose) && e.func(d.onError) && e.func(d.write);
        }
        h.is = u;
    })(o || (Yt.MessageWriter = o = {}));
    class l {
        constructor(){
            this.errorEmitter = new n.Emitter, this.closeEmitter = new n.Emitter;
        }
        dispose() {
            this.errorEmitter.dispose(), this.closeEmitter.dispose();
        }
        get onError() {
            return this.errorEmitter.event;
        }
        fireError(u, f, d) {
            this.errorEmitter.fire([
                this.asError(u),
                f,
                d
            ]);
        }
        get onClose() {
            return this.closeEmitter.event;
        }
        fireClose() {
            this.closeEmitter.fire(void 0);
        }
        asError(u) {
            return u instanceof Error ? u : new Error(`Writer received error. Reason: ${e.string(u.message) ? u.message : "unknown"}`);
        }
    }
    Yt.AbstractMessageWriter = l;
    var a;
    (function(h) {
        function u(f) {
            return f === void 0 || typeof f == "string" ? {
                charset: f ?? "utf-8",
                contentTypeEncoder: (0, i.default)().applicationJson.encoder
            } : {
                charset: f.charset ?? "utf-8",
                contentEncoder: f.contentEncoder,
                contentTypeEncoder: f.contentTypeEncoder ?? (0, i.default)().applicationJson.encoder
            };
        }
        h.fromOptions = u;
    })(a || (a = {}));
    class c extends l {
        constructor(u, f){
            super(), this.writable = u, this.options = a.fromOptions(f), this.errorCount = 0, this.writeSemaphore = new t.Semaphore(1), this.writable.onError((d)=>this.fireError(d)), this.writable.onClose(()=>this.fireClose());
        }
        async write(u) {
            return this.writeSemaphore.lock(async ()=>this.options.contentTypeEncoder.encode(u, this.options).then((d)=>this.options.contentEncoder !== void 0 ? this.options.contentEncoder.encode(d) : d).then((d)=>{
                    const p = [];
                    return p.push(r, d.byteLength.toString(), s), p.push(s), this.doWrite(u, p, d);
                }, (d)=>{
                    throw this.fireError(d), d;
                }));
        }
        async doWrite(u, f, d) {
            try {
                return await this.writable.write(f.join(""), "ascii"), this.writable.write(d);
            } catch (p) {
                return this.handleError(p, u), Promise.reject(p);
            }
        }
        handleError(u, f) {
            this.errorCount++, this.fireError(u, f, this.errorCount);
        }
        end() {
            this.writable.end();
        }
    }
    return Yt.WriteableStreamMessageWriter = c, Yt;
}
var nr = {}, zu;
function G1() {
    if (zu) return nr;
    zu = 1, Object.defineProperty(nr, "__esModule", {
        value: !0
    }), nr.AbstractMessageBuffer = void 0;
    const i = 13, e = 10, t = `\r
`;
    class n {
        constructor(s = "utf-8"){
            this._encoding = s, this._chunks = [], this._totalLength = 0;
        }
        get encoding() {
            return this._encoding;
        }
        append(s) {
            const o = typeof s == "string" ? this.fromString(s, this._encoding) : s;
            this._chunks.push(o), this._totalLength += o.byteLength;
        }
        tryReadHeaders(s = !1) {
            if (this._chunks.length === 0) return;
            let o = 0, l = 0, a = 0, c = 0;
            e: for(; l < this._chunks.length;){
                const d = this._chunks[l];
                for(a = 0; a < d.length;){
                    switch(d[a]){
                        case i:
                            switch(o){
                                case 0:
                                    o = 1;
                                    break;
                                case 2:
                                    o = 3;
                                    break;
                                default:
                                    o = 0;
                            }
                            break;
                        case e:
                            switch(o){
                                case 1:
                                    o = 2;
                                    break;
                                case 3:
                                    o = 4, a++;
                                    break e;
                                default:
                                    o = 0;
                            }
                            break;
                        default:
                            o = 0;
                    }
                    a++;
                }
                c += d.byteLength, l++;
            }
            if (o !== 4) return;
            const h = this._read(c + a), u = new Map, f = this.toString(h, "ascii").split(t);
            if (f.length < 2) return u;
            for(let d = 0; d < f.length - 2; d++){
                const p = f[d], y = p.indexOf(":");
                if (y === -1) throw new Error(`Message header must separate key and value using ':'
${p}`);
                const b = p.substr(0, y), k = p.substr(y + 1).trim();
                u.set(s ? b.toLowerCase() : b, k);
            }
            return u;
        }
        tryReadBody(s) {
            if (!(this._totalLength < s)) return this._read(s);
        }
        get numberOfBytes() {
            return this._totalLength;
        }
        _read(s) {
            if (s === 0) return this.emptyBuffer();
            if (s > this._totalLength) throw new Error("Cannot read so many bytes!");
            if (this._chunks[0].byteLength === s) {
                const c = this._chunks[0];
                return this._chunks.shift(), this._totalLength -= s, this.asNative(c);
            }
            if (this._chunks[0].byteLength > s) {
                const c = this._chunks[0], h = this.asNative(c, s);
                return this._chunks[0] = c.slice(s), this._totalLength -= s, h;
            }
            const o = this.allocNative(s);
            let l = 0, a = 0;
            for(; s > 0;){
                const c = this._chunks[a];
                if (c.byteLength > s) {
                    const h = c.slice(0, s);
                    o.set(h, l), l += s, this._chunks[a] = c.slice(s), this._totalLength -= s, s -= s;
                } else o.set(c, l), l += c.byteLength, this._chunks.shift(), this._totalLength -= c.byteLength, s -= c.byteLength;
            }
            return o;
        }
    }
    return nr.AbstractMessageBuffer = n, nr;
}
var ul = {}, Uu;
function J1() {
    return Uu || (Uu = 1, function(i) {
        Object.defineProperty(i, "__esModule", {
            value: !0
        }), i.createMessageConnection = i.ConnectionOptions = i.MessageStrategy = i.CancellationStrategy = i.CancellationSenderStrategy = i.CancellationReceiverStrategy = i.RequestCancellationReceiverStrategy = i.IdCancellationReceiverStrategy = i.ConnectionStrategy = i.ConnectionError = i.ConnectionErrors = i.LogTraceNotification = i.SetTraceNotification = i.TraceFormat = i.TraceValues = i.Trace = i.NullLogger = i.ProgressType = i.ProgressToken = void 0;
        const e = Xi(), t = qr(), n = om(), r = lm(), s = jr(), o = Vc();
        var l;
        (function(v) {
            v.type = new n.NotificationType("$/cancelRequest");
        })(l || (l = {}));
        var a;
        (function(v) {
            function N(B) {
                return typeof B == "string" || typeof B == "number";
            }
            v.is = N;
        })(a || (i.ProgressToken = a = {}));
        var c;
        (function(v) {
            v.type = new n.NotificationType("$/progress");
        })(c || (c = {}));
        class h {
            constructor(){}
        }
        i.ProgressType = h;
        var u;
        (function(v) {
            function N(B) {
                return t.func(B);
            }
            v.is = N;
        })(u || (u = {})), i.NullLogger = Object.freeze({
            error: ()=>{},
            warn: ()=>{},
            info: ()=>{},
            log: ()=>{}
        });
        var f;
        (function(v) {
            v[v.Off = 0] = "Off", v[v.Messages = 1] = "Messages", v[v.Compact = 2] = "Compact", v[v.Verbose = 3] = "Verbose";
        })(f || (i.Trace = f = {}));
        var d;
        (function(v) {
            v.Off = "off", v.Messages = "messages", v.Compact = "compact", v.Verbose = "verbose";
        })(d || (i.TraceValues = d = {})), function(v) {
            function N(_) {
                if (!t.string(_)) return v.Off;
                switch(_ = _.toLowerCase(), _){
                    case "off":
                        return v.Off;
                    case "messages":
                        return v.Messages;
                    case "compact":
                        return v.Compact;
                    case "verbose":
                        return v.Verbose;
                    default:
                        return v.Off;
                }
            }
            v.fromString = N;
            function B(_) {
                switch(_){
                    case v.Off:
                        return "off";
                    case v.Messages:
                        return "messages";
                    case v.Compact:
                        return "compact";
                    case v.Verbose:
                        return "verbose";
                    default:
                        return "off";
                }
            }
            v.toString = B;
        }(f || (i.Trace = f = {}));
        var p;
        (function(v) {
            v.Text = "text", v.JSON = "json";
        })(p || (i.TraceFormat = p = {})), function(v) {
            function N(B) {
                return t.string(B) ? (B = B.toLowerCase(), B === "json" ? v.JSON : v.Text) : v.Text;
            }
            v.fromString = N;
        }(p || (i.TraceFormat = p = {}));
        var y;
        (function(v) {
            v.type = new n.NotificationType("$/setTrace");
        })(y || (i.SetTraceNotification = y = {}));
        var b;
        (function(v) {
            v.type = new n.NotificationType("$/logTrace");
        })(b || (i.LogTraceNotification = b = {}));
        var k;
        (function(v) {
            v[v.Closed = 1] = "Closed", v[v.Disposed = 2] = "Disposed", v[v.AlreadyListening = 3] = "AlreadyListening";
        })(k || (i.ConnectionErrors = k = {}));
        class T extends Error {
            constructor(N, B){
                super(B), this.code = N, Object.setPrototypeOf(this, T.prototype);
            }
        }
        i.ConnectionError = T;
        var D;
        (function(v) {
            function N(B) {
                const _ = B;
                return _ && t.func(_.cancelUndispatched);
            }
            v.is = N;
        })(D || (i.ConnectionStrategy = D = {}));
        var S;
        (function(v) {
            function N(B) {
                const _ = B;
                return _ && (_.kind === void 0 || _.kind === "id") && t.func(_.createCancellationTokenSource) && (_.dispose === void 0 || t.func(_.dispose));
            }
            v.is = N;
        })(S || (i.IdCancellationReceiverStrategy = S = {}));
        var x;
        (function(v) {
            function N(B) {
                const _ = B;
                return _ && _.kind === "request" && t.func(_.createCancellationTokenSource) && (_.dispose === void 0 || t.func(_.dispose));
            }
            v.is = N;
        })(x || (i.RequestCancellationReceiverStrategy = x = {}));
        var R;
        (function(v) {
            v.Message = Object.freeze({
                createCancellationTokenSource (B) {
                    return new o.CancellationTokenSource;
                }
            });
            function N(B) {
                return S.is(B) || x.is(B);
            }
            v.is = N;
        })(R || (i.CancellationReceiverStrategy = R = {}));
        var E;
        (function(v) {
            v.Message = Object.freeze({
                sendCancellation (B, _) {
                    return B.sendNotification(l.type, {
                        id: _
                    });
                },
                cleanup (B) {}
            });
            function N(B) {
                const _ = B;
                return _ && t.func(_.sendCancellation) && t.func(_.cleanup);
            }
            v.is = N;
        })(E || (i.CancellationSenderStrategy = E = {}));
        var K;
        (function(v) {
            v.Message = Object.freeze({
                receiver: R.Message,
                sender: E.Message
            });
            function N(B) {
                const _ = B;
                return _ && R.is(_.receiver) && E.is(_.sender);
            }
            v.is = N;
        })(K || (i.CancellationStrategy = K = {}));
        var W;
        (function(v) {
            function N(B) {
                const _ = B;
                return _ && t.func(_.handleMessage);
            }
            v.is = N;
        })(W || (i.MessageStrategy = W = {}));
        var U;
        (function(v) {
            function N(B) {
                const _ = B;
                return _ && (K.is(_.cancellationStrategy) || D.is(_.connectionStrategy) || W.is(_.messageStrategy));
            }
            v.is = N;
        })(U || (i.ConnectionOptions = U = {}));
        var G;
        (function(v) {
            v[v.New = 1] = "New", v[v.Listening = 2] = "Listening", v[v.Closed = 3] = "Closed", v[v.Disposed = 4] = "Disposed";
        })(G || (G = {}));
        function L(v, N, B, _) {
            const V = B !== void 0 ? B : i.NullLogger;
            let xe = 0, ae = 0, de = 0;
            const qe = "2.0";
            let $e;
            const ot = new Map;
            let mt;
            const Ai = new Map, _i = new Map;
            let Zi, Ot = new r.LinkedMap, Dt = new Map, Ei = new Set, lt = new Map, ne = f.Off, Pt = p.Text, me, yt = G.New;
            const en = new s.Emitter, qn = new s.Emitter, jn = new s.Emitter, Fn = new s.Emitter, Hn = new s.Emitter, bt = _ && _.cancellationStrategy ? _.cancellationStrategy : K.Message;
            function Wn(m) {
                if (m === null) throw new Error("Can't send requests with id null since the response can't be correlated.");
                return "req-" + m.toString();
            }
            function Fr(m) {
                return m === null ? "res-unknown-" + (++de).toString() : "res-" + m.toString();
            }
            function Hr() {
                return "not-" + (++ae).toString();
            }
            function Wr(m, C) {
                n.Message.isRequest(C) ? m.set(Wn(C.id), C) : n.Message.isResponse(C) ? m.set(Fr(C.id), C) : m.set(Hr(), C);
            }
            function Vr(m) {}
            function Vn() {
                return yt === G.Listening;
            }
            function $n() {
                return yt === G.Closed;
            }
            function Kt() {
                return yt === G.Disposed;
            }
            function zn() {
                (yt === G.New || yt === G.Listening) && (yt = G.Closed, qn.fire(void 0));
            }
            function $r(m) {
                en.fire([
                    m,
                    void 0,
                    void 0
                ]);
            }
            function zr(m) {
                en.fire(m);
            }
            v.onClose(zn), v.onError($r), N.onClose(zn), N.onError(zr);
            function Un() {
                Zi || Ot.size === 0 || (Zi = (0, e.default)().timer.setImmediate(()=>{
                    Zi = void 0, Ur();
                }));
            }
            function Kn(m) {
                n.Message.isRequest(m) ? Gr(m) : n.Message.isNotification(m) ? Qr(m) : n.Message.isResponse(m) ? Jr(m) : Yr(m);
            }
            function Ur() {
                if (Ot.size === 0) return;
                const m = Ot.shift();
                try {
                    const C = _ == null ? void 0 : _.messageStrategy;
                    W.is(C) ? C.handleMessage(m, Kn) : Kn(m);
                } finally{
                    Un();
                }
            }
            const Kr = (m)=>{
                try {
                    if (n.Message.isNotification(m) && m.method === l.type.method) {
                        const C = m.params.id, M = Wn(C), j = Ot.get(M);
                        if (n.Message.isRequest(j)) {
                            const se = _ == null ? void 0 : _.connectionStrategy, ce = se && se.cancelUndispatched ? se.cancelUndispatched(j, Vr) : void 0;
                            if (ce && (ce.error !== void 0 || ce.result !== void 0)) {
                                Ot.delete(M), lt.delete(C), ce.id = j.id, Ni(ce, m.method, Date.now()), N.write(ce).catch(()=>V.error("Sending response for canceled message failed."));
                                return;
                            }
                        }
                        const he = lt.get(C);
                        if (he !== void 0) {
                            he.cancel(), tn(m);
                            return;
                        } else Ei.add(C);
                    }
                    Wr(Ot, m);
                } finally{
                    Un();
                }
            };
            function Gr(m) {
                if (Kt()) return;
                function C(Y, pe, te) {
                    const Re = {
                        jsonrpc: qe,
                        id: m.id
                    };
                    Y instanceof n.ResponseError ? Re.error = Y.toJson() : Re.result = Y === void 0 ? null : Y, Ni(Re, pe, te), N.write(Re).catch(()=>V.error("Sending response failed."));
                }
                function M(Y, pe, te) {
                    const Re = {
                        jsonrpc: qe,
                        id: m.id,
                        error: Y.toJson()
                    };
                    Ni(Re, pe, te), N.write(Re).catch(()=>V.error("Sending response failed."));
                }
                function j(Y, pe, te) {
                    Y === void 0 && (Y = null);
                    const Re = {
                        jsonrpc: qe,
                        id: m.id,
                        result: Y
                    };
                    Ni(Re, pe, te), N.write(Re).catch(()=>V.error("Sending response failed."));
                }
                es(m);
                const he = ot.get(m.method);
                let se, ce;
                he && (se = he.type, ce = he.handler);
                const Se = Date.now();
                if (ce || $e) {
                    const Y = m.id ?? String(Date.now()), pe = S.is(bt.receiver) ? bt.receiver.createCancellationTokenSource(Y) : bt.receiver.createCancellationTokenSource(m);
                    m.id !== null && Ei.has(m.id) && pe.cancel(), m.id !== null && lt.set(Y, pe);
                    try {
                        let te;
                        if (ce) {
                            if (m.params === void 0) {
                                if (se !== void 0 && se.numberOfParams !== 0) {
                                    M(new n.ResponseError(n.ErrorCodes.InvalidParams, `Request ${m.method} defines ${se.numberOfParams} params but received none.`), m.method, Se);
                                    return;
                                }
                                te = ce(pe.token);
                            } else if (Array.isArray(m.params)) {
                                if (se !== void 0 && se.parameterStructures === n.ParameterStructures.byName) {
                                    M(new n.ResponseError(n.ErrorCodes.InvalidParams, `Request ${m.method} defines parameters by name but received parameters by position`), m.method, Se);
                                    return;
                                }
                                te = ce(...m.params, pe.token);
                            } else {
                                if (se !== void 0 && se.parameterStructures === n.ParameterStructures.byPosition) {
                                    M(new n.ResponseError(n.ErrorCodes.InvalidParams, `Request ${m.method} defines parameters by position but received parameters by name`), m.method, Se);
                                    return;
                                }
                                te = ce(m.params, pe.token);
                            }
                        } else $e && (te = $e(m.method, m.params, pe.token));
                        const Re = te;
                        te ? Re.then ? Re.then((ze)=>{
                            lt.delete(Y), C(ze, m.method, Se);
                        }, (ze)=>{
                            lt.delete(Y), ze instanceof n.ResponseError ? M(ze, m.method, Se) : ze && t.string(ze.message) ? M(new n.ResponseError(n.ErrorCodes.InternalError, `Request ${m.method} failed with message: ${ze.message}`), m.method, Se) : M(new n.ResponseError(n.ErrorCodes.InternalError, `Request ${m.method} failed unexpectedly without providing any details.`), m.method, Se);
                        }) : (lt.delete(Y), C(te, m.method, Se)) : (lt.delete(Y), j(te, m.method, Se));
                    } catch (te) {
                        lt.delete(Y), te instanceof n.ResponseError ? C(te, m.method, Se) : te && t.string(te.message) ? M(new n.ResponseError(n.ErrorCodes.InternalError, `Request ${m.method} failed with message: ${te.message}`), m.method, Se) : M(new n.ResponseError(n.ErrorCodes.InternalError, `Request ${m.method} failed unexpectedly without providing any details.`), m.method, Se);
                    }
                } else M(new n.ResponseError(n.ErrorCodes.MethodNotFound, `Unhandled method ${m.method}`), m.method, Se);
            }
            function Jr(m) {
                if (!Kt()) {
                    if (m.id === null) m.error ? V.error(`Received response message without id: Error is: 
${JSON.stringify(m.error, void 0, 4)}`) : V.error("Received response message without id. No further error information provided.");
                    else {
                        const C = m.id, M = Dt.get(C);
                        if (ts(m, M), M !== void 0) {
                            Dt.delete(C);
                            try {
                                if (m.error) {
                                    const j = m.error;
                                    M.reject(new n.ResponseError(j.code, j.message, j.data));
                                } else if (m.result !== void 0) M.resolve(m.result);
                                else throw new Error("Should never happen.");
                            } catch (j) {
                                j.message ? V.error(`Response handler '${M.method}' failed with message: ${j.message}`) : V.error(`Response handler '${M.method}' failed unexpectedly.`);
                            }
                        }
                    }
                }
            }
            function Qr(m) {
                if (Kt()) return;
                let C, M;
                if (m.method === l.type.method) {
                    const j = m.params.id;
                    Ei.delete(j), tn(m);
                    return;
                } else {
                    const j = Ai.get(m.method);
                    j && (M = j.handler, C = j.type);
                }
                if (M || mt) try {
                    if (tn(m), M) {
                        if (m.params === void 0) C !== void 0 && C.numberOfParams !== 0 && C.parameterStructures !== n.ParameterStructures.byName && V.error(`Notification ${m.method} defines ${C.numberOfParams} params but received none.`), M();
                        else if (Array.isArray(m.params)) {
                            const j = m.params;
                            m.method === c.type.method && j.length === 2 && a.is(j[0]) ? M({
                                token: j[0],
                                value: j[1]
                            }) : (C !== void 0 && (C.parameterStructures === n.ParameterStructures.byName && V.error(`Notification ${m.method} defines parameters by name but received parameters by position`), C.numberOfParams !== m.params.length && V.error(`Notification ${m.method} defines ${C.numberOfParams} params but received ${j.length} arguments`)), M(...j));
                        } else C !== void 0 && C.parameterStructures === n.ParameterStructures.byPosition && V.error(`Notification ${m.method} defines parameters by position but received parameters by name`), M(m.params);
                    } else mt && mt(m.method, m.params);
                } catch (j) {
                    j.message ? V.error(`Notification handler '${m.method}' failed with message: ${j.message}`) : V.error(`Notification handler '${m.method}' failed unexpectedly.`);
                }
                else jn.fire(m);
            }
            function Yr(m) {
                if (!m) {
                    V.error("Received empty message.");
                    return;
                }
                V.error(`Received message which is neither a response nor a notification message:
${JSON.stringify(m, null, 4)}`);
                const C = m;
                if (t.string(C.id) || t.number(C.id)) {
                    const M = C.id, j = Dt.get(M);
                    j && j.reject(new Error("The received response has neither a result nor an error property."));
                }
            }
            function vt(m) {
                if (m != null) switch(ne){
                    case f.Verbose:
                        return JSON.stringify(m, null, 4);
                    case f.Compact:
                        return JSON.stringify(m);
                    default:
                        return;
                }
            }
            function Xr(m) {
                if (!(ne === f.Off || !me)) {
                    if (Pt === p.Text) {
                        let C;
                        (ne === f.Verbose || ne === f.Compact) && m.params && (C = `Params: ${vt(m.params)}

`), me.log(`Sending request '${m.method} - (${m.id})'.`, C);
                    } else Gt("send-request", m);
                }
            }
            function Zr(m) {
                if (!(ne === f.Off || !me)) {
                    if (Pt === p.Text) {
                        let C;
                        (ne === f.Verbose || ne === f.Compact) && (m.params ? C = `Params: ${vt(m.params)}

` : C = `No parameters provided.

`), me.log(`Sending notification '${m.method}'.`, C);
                    } else Gt("send-notification", m);
                }
            }
            function Ni(m, C, M) {
                if (!(ne === f.Off || !me)) {
                    if (Pt === p.Text) {
                        let j;
                        (ne === f.Verbose || ne === f.Compact) && (m.error && m.error.data ? j = `Error data: ${vt(m.error.data)}

` : m.result ? j = `Result: ${vt(m.result)}

` : m.error === void 0 && (j = `No result returned.

`)), me.log(`Sending response '${C} - (${m.id})'. Processing request took ${Date.now() - M}ms`, j);
                    } else Gt("send-response", m);
                }
            }
            function es(m) {
                if (!(ne === f.Off || !me)) {
                    if (Pt === p.Text) {
                        let C;
                        (ne === f.Verbose || ne === f.Compact) && m.params && (C = `Params: ${vt(m.params)}

`), me.log(`Received request '${m.method} - (${m.id})'.`, C);
                    } else Gt("receive-request", m);
                }
            }
            function tn(m) {
                if (!(ne === f.Off || !me || m.method === b.type.method)) {
                    if (Pt === p.Text) {
                        let C;
                        (ne === f.Verbose || ne === f.Compact) && (m.params ? C = `Params: ${vt(m.params)}

` : C = `No parameters provided.

`), me.log(`Received notification '${m.method}'.`, C);
                    } else Gt("receive-notification", m);
                }
            }
            function ts(m, C) {
                if (!(ne === f.Off || !me)) {
                    if (Pt === p.Text) {
                        let M;
                        if ((ne === f.Verbose || ne === f.Compact) && (m.error && m.error.data ? M = `Error data: ${vt(m.error.data)}

` : m.result ? M = `Result: ${vt(m.result)}

` : m.error === void 0 && (M = `No result returned.

`)), C) {
                            const j = m.error ? ` Request failed: ${m.error.message} (${m.error.code}).` : "";
                            me.log(`Received response '${C.method} - (${m.id})' in ${Date.now() - C.timerStart}ms.${j}`, M);
                        } else me.log(`Received response ${m.id} without active response promise.`, M);
                    } else Gt("receive-response", m);
                }
            }
            function Gt(m, C) {
                if (!me || ne === f.Off) return;
                const M = {
                    isLSPMessage: !0,
                    type: m,
                    message: C,
                    timestamp: Date.now()
                };
                me.log(M);
            }
            function ai() {
                if ($n()) throw new T(k.Closed, "Connection is closed.");
                if (Kt()) throw new T(k.Disposed, "Connection is disposed.");
            }
            function is() {
                if (Vn()) throw new T(k.AlreadyListening, "Connection is already listening");
            }
            function ns() {
                if (!Vn()) throw new Error("Call listen() first.");
            }
            function ci(m) {
                return m === void 0 ? null : m;
            }
            function Gn(m) {
                if (m !== null) return m;
            }
            function g(m) {
                return m != null && !Array.isArray(m) && typeof m == "object";
            }
            function we(m, C) {
                switch(m){
                    case n.ParameterStructures.auto:
                        return g(C) ? Gn(C) : [
                            ci(C)
                        ];
                    case n.ParameterStructures.byName:
                        if (!g(C)) throw new Error("Received parameters by name but param is not an object literal.");
                        return Gn(C);
                    case n.ParameterStructures.byPosition:
                        return [
                            ci(C)
                        ];
                    default:
                        throw new Error(`Unknown parameter structure ${m.toString()}`);
                }
            }
            function ke(m, C) {
                let M;
                const j = m.numberOfParams;
                switch(j){
                    case 0:
                        M = void 0;
                        break;
                    case 1:
                        M = we(m.parameterStructures, C[0]);
                        break;
                    default:
                        M = [];
                        for(let he = 0; he < C.length && he < j; he++)M.push(ci(C[he]));
                        if (C.length < j) for(let he = C.length; he < j; he++)M.push(null);
                        break;
                }
                return M;
            }
            const z = {
                sendNotification: (m, ...C)=>{
                    ai();
                    let M, j;
                    if (t.string(m)) {
                        M = m;
                        const se = C[0];
                        let ce = 0, Se = n.ParameterStructures.auto;
                        n.ParameterStructures.is(se) && (ce = 1, Se = se);
                        let Y = C.length;
                        const pe = Y - ce;
                        switch(pe){
                            case 0:
                                j = void 0;
                                break;
                            case 1:
                                j = we(Se, C[ce]);
                                break;
                            default:
                                if (Se === n.ParameterStructures.byName) throw new Error(`Received ${pe} parameters for 'by Name' notification parameter structure.`);
                                j = C.slice(ce, Y).map((te)=>ci(te));
                                break;
                        }
                    } else {
                        const se = C;
                        M = m.method, j = ke(m, se);
                    }
                    const he = {
                        jsonrpc: qe,
                        method: M,
                        params: j
                    };
                    return Zr(he), N.write(he).catch((se)=>{
                        throw V.error("Sending notification failed."), se;
                    });
                },
                onNotification: (m, C)=>{
                    ai();
                    let M;
                    return t.func(m) ? mt = m : C && (t.string(m) ? (M = m, Ai.set(m, {
                        type: void 0,
                        handler: C
                    })) : (M = m.method, Ai.set(m.method, {
                        type: m,
                        handler: C
                    }))), {
                        dispose: ()=>{
                            M !== void 0 ? Ai.delete(M) : mt = void 0;
                        }
                    };
                },
                onProgress: (m, C, M)=>{
                    if (_i.has(C)) throw new Error(`Progress handler for token ${C} already registered`);
                    return _i.set(C, M), {
                        dispose: ()=>{
                            _i.delete(C);
                        }
                    };
                },
                sendProgress: (m, C, M)=>z.sendNotification(c.type, {
                        token: C,
                        value: M
                    }),
                onUnhandledProgress: Fn.event,
                sendRequest: (m, ...C)=>{
                    ai(), ns();
                    let M, j, he;
                    if (t.string(m)) {
                        M = m;
                        const Y = C[0], pe = C[C.length - 1];
                        let te = 0, Re = n.ParameterStructures.auto;
                        n.ParameterStructures.is(Y) && (te = 1, Re = Y);
                        let ze = C.length;
                        o.CancellationToken.is(pe) && (ze = ze - 1, he = pe);
                        const Mt = ze - te;
                        switch(Mt){
                            case 0:
                                j = void 0;
                                break;
                            case 1:
                                j = we(Re, C[te]);
                                break;
                            default:
                                if (Re === n.ParameterStructures.byName) throw new Error(`Received ${Mt} parameters for 'by Name' request parameter structure.`);
                                j = C.slice(te, ze).map((bm)=>ci(bm));
                                break;
                        }
                    } else {
                        const Y = C;
                        M = m.method, j = ke(m, Y);
                        const pe = m.numberOfParams;
                        he = o.CancellationToken.is(Y[pe]) ? Y[pe] : void 0;
                    }
                    const se = xe++;
                    let ce;
                    he && (ce = he.onCancellationRequested(()=>{
                        const Y = bt.sender.sendCancellation(z, se);
                        return Y === void 0 ? (V.log(`Received no promise from cancellation strategy when cancelling id ${se}`), Promise.resolve()) : Y.catch(()=>{
                            V.log(`Sending cancellation messages for id ${se} failed`);
                        });
                    }));
                    const Se = {
                        jsonrpc: qe,
                        id: se,
                        method: M,
                        params: j
                    };
                    return Xr(Se), typeof bt.sender.enableCancellation == "function" && bt.sender.enableCancellation(Se), new Promise(async (Y, pe)=>{
                        const te = (Mt)=>{
                            Y(Mt), bt.sender.cleanup(se), ce == null || ce.dispose();
                        }, Re = (Mt)=>{
                            pe(Mt), bt.sender.cleanup(se), ce == null || ce.dispose();
                        }, ze = {
                            method: M,
                            timerStart: Date.now(),
                            resolve: te,
                            reject: Re
                        };
                        try {
                            await N.write(Se), Dt.set(se, ze);
                        } catch (Mt) {
                            throw V.error("Sending request failed."), ze.reject(new n.ResponseError(n.ErrorCodes.MessageWriteError, Mt.message ? Mt.message : "Unknown reason")), Mt;
                        }
                    });
                },
                onRequest: (m, C)=>{
                    ai();
                    let M = null;
                    return u.is(m) ? (M = void 0, $e = m) : t.string(m) ? (M = null, C !== void 0 && (M = m, ot.set(m, {
                        handler: C,
                        type: void 0
                    }))) : C !== void 0 && (M = m.method, ot.set(m.method, {
                        type: m,
                        handler: C
                    })), {
                        dispose: ()=>{
                            M !== null && (M !== void 0 ? ot.delete(M) : $e = void 0);
                        }
                    };
                },
                hasPendingResponse: ()=>Dt.size > 0,
                trace: async (m, C, M)=>{
                    let j = !1, he = p.Text;
                    M !== void 0 && (t.boolean(M) ? j = M : (j = M.sendNotification || !1, he = M.traceFormat || p.Text)), ne = m, Pt = he, ne === f.Off ? me = void 0 : me = C, j && !$n() && !Kt() && await z.sendNotification(y.type, {
                        value: f.toString(m)
                    });
                },
                onError: en.event,
                onClose: qn.event,
                onUnhandledNotification: jn.event,
                onDispose: Hn.event,
                end: ()=>{
                    N.end();
                },
                dispose: ()=>{
                    if (Kt()) return;
                    yt = G.Disposed, Hn.fire(void 0);
                    const m = new n.ResponseError(n.ErrorCodes.PendingResponseRejected, "Pending response rejected since connection got disposed");
                    for (const C of Dt.values())C.reject(m);
                    Dt = new Map, lt = new Map, Ei = new Set, Ot = new r.LinkedMap, t.func(N.dispose) && N.dispose(), t.func(v.dispose) && v.dispose();
                },
                listen: ()=>{
                    ai(), is(), yt = G.Listening, v.listen(Kr);
                },
                inspect: ()=>{
                    (0, e.default)().console.log("inspect");
                }
            };
            return z.onNotification(b.type, (m)=>{
                if (ne === f.Off || !me) return;
                const C = ne === f.Verbose || ne === f.Compact;
                me.log(m.message, C ? m.verbose : void 0);
            }), z.onNotification(c.type, (m)=>{
                const C = _i.get(m.token);
                C ? C(m.value) : Fn.fire(m);
            }), z;
        }
        i.createMessageConnection = L;
    }(ul)), ul;
}
var Ku;
function oa() {
    return Ku || (Ku = 1, function(i) {
        Object.defineProperty(i, "__esModule", {
            value: !0
        }), i.ProgressType = i.ProgressToken = i.createMessageConnection = i.NullLogger = i.ConnectionOptions = i.ConnectionStrategy = i.AbstractMessageBuffer = i.WriteableStreamMessageWriter = i.AbstractMessageWriter = i.MessageWriter = i.ReadableStreamMessageReader = i.AbstractMessageReader = i.MessageReader = i.SharedArrayReceiverStrategy = i.SharedArraySenderStrategy = i.CancellationToken = i.CancellationTokenSource = i.Emitter = i.Event = i.Disposable = i.LRUCache = i.Touch = i.LinkedMap = i.ParameterStructures = i.NotificationType9 = i.NotificationType8 = i.NotificationType7 = i.NotificationType6 = i.NotificationType5 = i.NotificationType4 = i.NotificationType3 = i.NotificationType2 = i.NotificationType1 = i.NotificationType0 = i.NotificationType = i.ErrorCodes = i.ResponseError = i.RequestType9 = i.RequestType8 = i.RequestType7 = i.RequestType6 = i.RequestType5 = i.RequestType4 = i.RequestType3 = i.RequestType2 = i.RequestType1 = i.RequestType0 = i.RequestType = i.Message = i.RAL = void 0, i.MessageStrategy = i.CancellationStrategy = i.CancellationSenderStrategy = i.CancellationReceiverStrategy = i.ConnectionError = i.ConnectionErrors = i.LogTraceNotification = i.SetTraceNotification = i.TraceFormat = i.TraceValues = i.Trace = void 0;
        const e = om();
        Object.defineProperty(i, "Message", {
            enumerable: !0,
            get: function() {
                return e.Message;
            }
        }), Object.defineProperty(i, "RequestType", {
            enumerable: !0,
            get: function() {
                return e.RequestType;
            }
        }), Object.defineProperty(i, "RequestType0", {
            enumerable: !0,
            get: function() {
                return e.RequestType0;
            }
        }), Object.defineProperty(i, "RequestType1", {
            enumerable: !0,
            get: function() {
                return e.RequestType1;
            }
        }), Object.defineProperty(i, "RequestType2", {
            enumerable: !0,
            get: function() {
                return e.RequestType2;
            }
        }), Object.defineProperty(i, "RequestType3", {
            enumerable: !0,
            get: function() {
                return e.RequestType3;
            }
        }), Object.defineProperty(i, "RequestType4", {
            enumerable: !0,
            get: function() {
                return e.RequestType4;
            }
        }), Object.defineProperty(i, "RequestType5", {
            enumerable: !0,
            get: function() {
                return e.RequestType5;
            }
        }), Object.defineProperty(i, "RequestType6", {
            enumerable: !0,
            get: function() {
                return e.RequestType6;
            }
        }), Object.defineProperty(i, "RequestType7", {
            enumerable: !0,
            get: function() {
                return e.RequestType7;
            }
        }), Object.defineProperty(i, "RequestType8", {
            enumerable: !0,
            get: function() {
                return e.RequestType8;
            }
        }), Object.defineProperty(i, "RequestType9", {
            enumerable: !0,
            get: function() {
                return e.RequestType9;
            }
        }), Object.defineProperty(i, "ResponseError", {
            enumerable: !0,
            get: function() {
                return e.ResponseError;
            }
        }), Object.defineProperty(i, "ErrorCodes", {
            enumerable: !0,
            get: function() {
                return e.ErrorCodes;
            }
        }), Object.defineProperty(i, "NotificationType", {
            enumerable: !0,
            get: function() {
                return e.NotificationType;
            }
        }), Object.defineProperty(i, "NotificationType0", {
            enumerable: !0,
            get: function() {
                return e.NotificationType0;
            }
        }), Object.defineProperty(i, "NotificationType1", {
            enumerable: !0,
            get: function() {
                return e.NotificationType1;
            }
        }), Object.defineProperty(i, "NotificationType2", {
            enumerable: !0,
            get: function() {
                return e.NotificationType2;
            }
        }), Object.defineProperty(i, "NotificationType3", {
            enumerable: !0,
            get: function() {
                return e.NotificationType3;
            }
        }), Object.defineProperty(i, "NotificationType4", {
            enumerable: !0,
            get: function() {
                return e.NotificationType4;
            }
        }), Object.defineProperty(i, "NotificationType5", {
            enumerable: !0,
            get: function() {
                return e.NotificationType5;
            }
        }), Object.defineProperty(i, "NotificationType6", {
            enumerable: !0,
            get: function() {
                return e.NotificationType6;
            }
        }), Object.defineProperty(i, "NotificationType7", {
            enumerable: !0,
            get: function() {
                return e.NotificationType7;
            }
        }), Object.defineProperty(i, "NotificationType8", {
            enumerable: !0,
            get: function() {
                return e.NotificationType8;
            }
        }), Object.defineProperty(i, "NotificationType9", {
            enumerable: !0,
            get: function() {
                return e.NotificationType9;
            }
        }), Object.defineProperty(i, "ParameterStructures", {
            enumerable: !0,
            get: function() {
                return e.ParameterStructures;
            }
        });
        const t = lm();
        Object.defineProperty(i, "LinkedMap", {
            enumerable: !0,
            get: function() {
                return t.LinkedMap;
            }
        }), Object.defineProperty(i, "LRUCache", {
            enumerable: !0,
            get: function() {
                return t.LRUCache;
            }
        }), Object.defineProperty(i, "Touch", {
            enumerable: !0,
            get: function() {
                return t.Touch;
            }
        });
        const n = $1();
        Object.defineProperty(i, "Disposable", {
            enumerable: !0,
            get: function() {
                return n.Disposable;
            }
        });
        const r = jr();
        Object.defineProperty(i, "Event", {
            enumerable: !0,
            get: function() {
                return r.Event;
            }
        }), Object.defineProperty(i, "Emitter", {
            enumerable: !0,
            get: function() {
                return r.Emitter;
            }
        });
        const s = Vc();
        Object.defineProperty(i, "CancellationTokenSource", {
            enumerable: !0,
            get: function() {
                return s.CancellationTokenSource;
            }
        }), Object.defineProperty(i, "CancellationToken", {
            enumerable: !0,
            get: function() {
                return s.CancellationToken;
            }
        });
        const o = z1();
        Object.defineProperty(i, "SharedArraySenderStrategy", {
            enumerable: !0,
            get: function() {
                return o.SharedArraySenderStrategy;
            }
        }), Object.defineProperty(i, "SharedArrayReceiverStrategy", {
            enumerable: !0,
            get: function() {
                return o.SharedArrayReceiverStrategy;
            }
        });
        const l = U1();
        Object.defineProperty(i, "MessageReader", {
            enumerable: !0,
            get: function() {
                return l.MessageReader;
            }
        }), Object.defineProperty(i, "AbstractMessageReader", {
            enumerable: !0,
            get: function() {
                return l.AbstractMessageReader;
            }
        }), Object.defineProperty(i, "ReadableStreamMessageReader", {
            enumerable: !0,
            get: function() {
                return l.ReadableStreamMessageReader;
            }
        });
        const a = K1();
        Object.defineProperty(i, "MessageWriter", {
            enumerable: !0,
            get: function() {
                return a.MessageWriter;
            }
        }), Object.defineProperty(i, "AbstractMessageWriter", {
            enumerable: !0,
            get: function() {
                return a.AbstractMessageWriter;
            }
        }), Object.defineProperty(i, "WriteableStreamMessageWriter", {
            enumerable: !0,
            get: function() {
                return a.WriteableStreamMessageWriter;
            }
        });
        const c = G1();
        Object.defineProperty(i, "AbstractMessageBuffer", {
            enumerable: !0,
            get: function() {
                return c.AbstractMessageBuffer;
            }
        });
        const h = J1();
        Object.defineProperty(i, "ConnectionStrategy", {
            enumerable: !0,
            get: function() {
                return h.ConnectionStrategy;
            }
        }), Object.defineProperty(i, "ConnectionOptions", {
            enumerable: !0,
            get: function() {
                return h.ConnectionOptions;
            }
        }), Object.defineProperty(i, "NullLogger", {
            enumerable: !0,
            get: function() {
                return h.NullLogger;
            }
        }), Object.defineProperty(i, "createMessageConnection", {
            enumerable: !0,
            get: function() {
                return h.createMessageConnection;
            }
        }), Object.defineProperty(i, "ProgressToken", {
            enumerable: !0,
            get: function() {
                return h.ProgressToken;
            }
        }), Object.defineProperty(i, "ProgressType", {
            enumerable: !0,
            get: function() {
                return h.ProgressType;
            }
        }), Object.defineProperty(i, "Trace", {
            enumerable: !0,
            get: function() {
                return h.Trace;
            }
        }), Object.defineProperty(i, "TraceValues", {
            enumerable: !0,
            get: function() {
                return h.TraceValues;
            }
        }), Object.defineProperty(i, "TraceFormat", {
            enumerable: !0,
            get: function() {
                return h.TraceFormat;
            }
        }), Object.defineProperty(i, "SetTraceNotification", {
            enumerable: !0,
            get: function() {
                return h.SetTraceNotification;
            }
        }), Object.defineProperty(i, "LogTraceNotification", {
            enumerable: !0,
            get: function() {
                return h.LogTraceNotification;
            }
        }), Object.defineProperty(i, "ConnectionErrors", {
            enumerable: !0,
            get: function() {
                return h.ConnectionErrors;
            }
        }), Object.defineProperty(i, "ConnectionError", {
            enumerable: !0,
            get: function() {
                return h.ConnectionError;
            }
        }), Object.defineProperty(i, "CancellationReceiverStrategy", {
            enumerable: !0,
            get: function() {
                return h.CancellationReceiverStrategy;
            }
        }), Object.defineProperty(i, "CancellationSenderStrategy", {
            enumerable: !0,
            get: function() {
                return h.CancellationSenderStrategy;
            }
        }), Object.defineProperty(i, "CancellationStrategy", {
            enumerable: !0,
            get: function() {
                return h.CancellationStrategy;
            }
        }), Object.defineProperty(i, "MessageStrategy", {
            enumerable: !0,
            get: function() {
                return h.MessageStrategy;
            }
        });
        const u = Xi();
        i.RAL = u.default;
    }(hl)), hl;
}
Object.defineProperty(Wc, "__esModule", {
    value: !0
});
const jt = oa();
class _o extends jt.AbstractMessageBuffer {
    constructor(e = "utf-8"){
        super(e), this.asciiDecoder = new TextDecoder("ascii");
    }
    emptyBuffer() {
        return _o.emptyBuffer;
    }
    fromString(e, t) {
        return new TextEncoder().encode(e);
    }
    toString(e, t) {
        return t === "ascii" ? this.asciiDecoder.decode(e) : new TextDecoder(t).decode(e);
    }
    asNative(e, t) {
        return t === void 0 ? e : e.slice(0, t);
    }
    allocNative(e) {
        return new Uint8Array(e);
    }
}
_o.emptyBuffer = new Uint8Array(0);
class Q1 {
    constructor(e){
        this.socket = e, this._onData = new jt.Emitter, this._messageListener = (t)=>{
            t.data.arrayBuffer().then((r)=>{
                this._onData.fire(new Uint8Array(r));
            }, ()=>{
                (0, jt.RAL)().console.error("Converting blob to array buffer failed.");
            });
        }, this.socket.addEventListener("message", this._messageListener);
    }
    onClose(e) {
        return this.socket.addEventListener("close", e), jt.Disposable.create(()=>this.socket.removeEventListener("close", e));
    }
    onError(e) {
        return this.socket.addEventListener("error", e), jt.Disposable.create(()=>this.socket.removeEventListener("error", e));
    }
    onEnd(e) {
        return this.socket.addEventListener("end", e), jt.Disposable.create(()=>this.socket.removeEventListener("end", e));
    }
    onData(e) {
        return this._onData.event(e);
    }
}
class Y1 {
    constructor(e){
        this.socket = e;
    }
    onClose(e) {
        return this.socket.addEventListener("close", e), jt.Disposable.create(()=>this.socket.removeEventListener("close", e));
    }
    onError(e) {
        return this.socket.addEventListener("error", e), jt.Disposable.create(()=>this.socket.removeEventListener("error", e));
    }
    onEnd(e) {
        return this.socket.addEventListener("end", e), jt.Disposable.create(()=>this.socket.removeEventListener("end", e));
    }
    write(e, t) {
        if (typeof e == "string") {
            if (t !== void 0 && t !== "utf-8") throw new Error(`In a Browser environments only utf-8 text encoding is supported. But got encoding: ${t}`);
            this.socket.send(e);
        } else this.socket.send(e);
        return Promise.resolve();
    }
    end() {
        this.socket.close();
    }
}
const X1 = new TextEncoder, cm = Object.freeze({
    messageBuffer: Object.freeze({
        create: (i)=>new _o(i)
    }),
    applicationJson: Object.freeze({
        encoder: Object.freeze({
            name: "application/json",
            encode: (i, e)=>{
                if (e.charset !== "utf-8") throw new Error(`In a Browser environments only utf-8 text encoding is supported. But got encoding: ${e.charset}`);
                return Promise.resolve(X1.encode(JSON.stringify(i, void 0, 0)));
            }
        }),
        decoder: Object.freeze({
            name: "application/json",
            decode: (i, e)=>{
                if (!(i instanceof Uint8Array)) throw new Error("In a Browser environments only Uint8Arrays are supported.");
                return Promise.resolve(JSON.parse(new TextDecoder(e.charset).decode(i)));
            }
        })
    }),
    stream: Object.freeze({
        asReadableStream: (i)=>new Q1(i),
        asWritableStream: (i)=>new Y1(i)
    }),
    console,
    timer: Object.freeze({
        setTimeout (i, e, ...t) {
            const n = setTimeout(i, e, ...t);
            return {
                dispose: ()=>clearTimeout(n)
            };
        },
        setImmediate (i, ...e) {
            const t = setTimeout(i, 0, ...e);
            return {
                dispose: ()=>clearTimeout(t)
            };
        },
        setInterval (i, e, ...t) {
            const n = setInterval(i, e, ...t);
            return {
                dispose: ()=>clearInterval(n)
            };
        }
    })
});
function la() {
    return cm;
}
(function(i) {
    function e() {
        jt.RAL.install(cm);
    }
    i.install = e;
})(la || (la = {}));
Wc.default = la;
(function(i) {
    var e = H && H.__createBinding || (Object.create ? function(a, c, h, u) {
        u === void 0 && (u = h);
        var f = Object.getOwnPropertyDescriptor(c, h);
        (!f || ("get" in f ? !c.__esModule : f.writable || f.configurable)) && (f = {
            enumerable: !0,
            get: function() {
                return c[h];
            }
        }), Object.defineProperty(a, u, f);
    } : function(a, c, h, u) {
        u === void 0 && (u = h), a[u] = c[h];
    }), t = H && H.__exportStar || function(a, c) {
        for(var h in a)h !== "default" && !Object.prototype.hasOwnProperty.call(c, h) && e(c, a, h);
    };
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.createMessageConnection = i.BrowserMessageWriter = i.BrowserMessageReader = void 0, Wc.default.install();
    const r = oa();
    t(oa(), i);
    class s extends r.AbstractMessageReader {
        constructor(c){
            super(), this._onData = new r.Emitter, this._messageListener = (h)=>{
                this._onData.fire(h.data);
            }, c.addEventListener("error", (h)=>this.fireError(h)), c.onmessage = this._messageListener;
        }
        listen(c) {
            return this._onData.event(c);
        }
    }
    i.BrowserMessageReader = s;
    class o extends r.AbstractMessageWriter {
        constructor(c){
            super(), this.port = c, this.errorCount = 0, c.addEventListener("error", (h)=>this.fireError(h));
        }
        write(c) {
            try {
                return this.port.postMessage(c), Promise.resolve();
            } catch (h) {
                return this.handleError(h, c), Promise.reject(h);
            }
        }
        handleError(c, h) {
            this.errorCount++, this.fireError(c, h, this.errorCount);
        }
        end() {}
    }
    i.BrowserMessageWriter = o;
    function l(a, c, h, u) {
        return h === void 0 && (h = r.NullLogger), r.ConnectionStrategy.is(u) && (u = {
            connectionStrategy: u
        }), (0, r.createMessageConnection)(a, c, h, u);
    }
    i.createMessageConnection = l;
})(Yi);
var Gu = Yi, hm = {}, aa;
(function(i) {
    function e(t) {
        return typeof t == "string";
    }
    i.is = e;
})(aa || (aa = {}));
var no;
(function(i) {
    function e(t) {
        return typeof t == "string";
    }
    i.is = e;
})(no || (no = {}));
var ca;
(function(i) {
    i.MIN_VALUE = -2147483648, i.MAX_VALUE = 2147483647;
    function e(t) {
        return typeof t == "number" && i.MIN_VALUE <= t && t <= i.MAX_VALUE;
    }
    i.is = e;
})(ca || (ca = {}));
var kr;
(function(i) {
    i.MIN_VALUE = 0, i.MAX_VALUE = 2147483647;
    function e(t) {
        return typeof t == "number" && i.MIN_VALUE <= t && t <= i.MAX_VALUE;
    }
    i.is = e;
})(kr || (kr = {}));
var at;
(function(i) {
    function e(n, r) {
        return n === Number.MAX_VALUE && (n = kr.MAX_VALUE), r === Number.MAX_VALUE && (r = kr.MAX_VALUE), {
            line: n,
            character: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.objectLiteral(r) && w.uinteger(r.line) && w.uinteger(r.character);
    }
    i.is = t;
})(at || (at = {}));
var ve;
(function(i) {
    function e(n, r, s, o) {
        if (w.uinteger(n) && w.uinteger(r) && w.uinteger(s) && w.uinteger(o)) return {
            start: at.create(n, r),
            end: at.create(s, o)
        };
        if (at.is(n) && at.is(r)) return {
            start: n,
            end: r
        };
        throw new Error(`Range#create called with invalid arguments[${n}, ${r}, ${s}, ${o}]`);
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.objectLiteral(r) && at.is(r.start) && at.is(r.end);
    }
    i.is = t;
})(ve || (ve = {}));
var Sr;
(function(i) {
    function e(n, r) {
        return {
            uri: n,
            range: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.objectLiteral(r) && ve.is(r.range) && (w.string(r.uri) || w.undefined(r.uri));
    }
    i.is = t;
})(Sr || (Sr = {}));
var ha;
(function(i) {
    function e(n, r, s, o) {
        return {
            targetUri: n,
            targetRange: r,
            targetSelectionRange: s,
            originSelectionRange: o
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.objectLiteral(r) && ve.is(r.targetRange) && w.string(r.targetUri) && ve.is(r.targetSelectionRange) && (ve.is(r.originSelectionRange) || w.undefined(r.originSelectionRange));
    }
    i.is = t;
})(ha || (ha = {}));
var ro;
(function(i) {
    function e(n, r, s, o) {
        return {
            red: n,
            green: r,
            blue: s,
            alpha: o
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && w.numberRange(r.red, 0, 1) && w.numberRange(r.green, 0, 1) && w.numberRange(r.blue, 0, 1) && w.numberRange(r.alpha, 0, 1);
    }
    i.is = t;
})(ro || (ro = {}));
var ua;
(function(i) {
    function e(n, r) {
        return {
            range: n,
            color: r
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && ve.is(r.range) && ro.is(r.color);
    }
    i.is = t;
})(ua || (ua = {}));
var fa;
(function(i) {
    function e(n, r, s) {
        return {
            label: n,
            textEdit: r,
            additionalTextEdits: s
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && w.string(r.label) && (w.undefined(r.textEdit) || Wt.is(r)) && (w.undefined(r.additionalTextEdits) || w.typedArray(r.additionalTextEdits, Wt.is));
    }
    i.is = t;
})(fa || (fa = {}));
var da;
(function(i) {
    i.Comment = "comment", i.Imports = "imports", i.Region = "region";
})(da || (da = {}));
var pa;
(function(i) {
    function e(n, r, s, o, l, a) {
        const c = {
            startLine: n,
            endLine: r
        };
        return w.defined(s) && (c.startCharacter = s), w.defined(o) && (c.endCharacter = o), w.defined(l) && (c.kind = l), w.defined(a) && (c.collapsedText = a), c;
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && w.uinteger(r.startLine) && w.uinteger(r.startLine) && (w.undefined(r.startCharacter) || w.uinteger(r.startCharacter)) && (w.undefined(r.endCharacter) || w.uinteger(r.endCharacter)) && (w.undefined(r.kind) || w.string(r.kind));
    }
    i.is = t;
})(pa || (pa = {}));
var so;
(function(i) {
    function e(n, r) {
        return {
            location: n,
            message: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && Sr.is(r.location) && w.string(r.message);
    }
    i.is = t;
})(so || (so = {}));
var ga;
(function(i) {
    i.Error = 1, i.Warning = 2, i.Information = 3, i.Hint = 4;
})(ga || (ga = {}));
var ma;
(function(i) {
    i.Unnecessary = 1, i.Deprecated = 2;
})(ma || (ma = {}));
var ya;
(function(i) {
    function e(t) {
        const n = t;
        return w.objectLiteral(n) && w.string(n.href);
    }
    i.is = e;
})(ya || (ya = {}));
var Cr;
(function(i) {
    function e(n, r, s, o, l, a) {
        let c = {
            range: n,
            message: r
        };
        return w.defined(s) && (c.severity = s), w.defined(o) && (c.code = o), w.defined(l) && (c.source = l), w.defined(a) && (c.relatedInformation = a), c;
    }
    i.create = e;
    function t(n) {
        var r;
        let s = n;
        return w.defined(s) && ve.is(s.range) && w.string(s.message) && (w.number(s.severity) || w.undefined(s.severity)) && (w.integer(s.code) || w.string(s.code) || w.undefined(s.code)) && (w.undefined(s.codeDescription) || w.string((r = s.codeDescription) === null || r === void 0 ? void 0 : r.href)) && (w.string(s.source) || w.undefined(s.source)) && (w.undefined(s.relatedInformation) || w.typedArray(s.relatedInformation, so.is));
    }
    i.is = t;
})(Cr || (Cr = {}));
var Ji;
(function(i) {
    function e(n, r, ...s) {
        let o = {
            title: n,
            command: r
        };
        return w.defined(s) && s.length > 0 && (o.arguments = s), o;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.string(r.title) && w.string(r.command);
    }
    i.is = t;
})(Ji || (Ji = {}));
var Wt;
(function(i) {
    function e(s, o) {
        return {
            range: s,
            newText: o
        };
    }
    i.replace = e;
    function t(s, o) {
        return {
            range: {
                start: s,
                end: s
            },
            newText: o
        };
    }
    i.insert = t;
    function n(s) {
        return {
            range: s,
            newText: ""
        };
    }
    i.del = n;
    function r(s) {
        const o = s;
        return w.objectLiteral(o) && w.string(o.newText) && ve.is(o.range);
    }
    i.is = r;
})(Wt || (Wt = {}));
var Vi;
(function(i) {
    function e(n, r, s) {
        const o = {
            label: n
        };
        return r !== void 0 && (o.needsConfirmation = r), s !== void 0 && (o.description = s), o;
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && w.string(r.label) && (w.boolean(r.needsConfirmation) || r.needsConfirmation === void 0) && (w.string(r.description) || r.description === void 0);
    }
    i.is = t;
})(Vi || (Vi = {}));
var Be;
(function(i) {
    function e(t) {
        const n = t;
        return w.string(n);
    }
    i.is = e;
})(Be || (Be = {}));
var Xt;
(function(i) {
    function e(s, o, l) {
        return {
            range: s,
            newText: o,
            annotationId: l
        };
    }
    i.replace = e;
    function t(s, o, l) {
        return {
            range: {
                start: s,
                end: s
            },
            newText: o,
            annotationId: l
        };
    }
    i.insert = t;
    function n(s, o) {
        return {
            range: s,
            newText: "",
            annotationId: o
        };
    }
    i.del = n;
    function r(s) {
        const o = s;
        return Wt.is(o) && (Vi.is(o.annotationId) || Be.is(o.annotationId));
    }
    i.is = r;
})(Xt || (Xt = {}));
var Tr;
(function(i) {
    function e(n, r) {
        return {
            textDocument: n,
            edits: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && xr.is(r.textDocument) && Array.isArray(r.edits);
    }
    i.is = t;
})(Tr || (Tr = {}));
var vn;
(function(i) {
    function e(n, r, s) {
        let o = {
            kind: "create",
            uri: n
        };
        return r !== void 0 && (r.overwrite !== void 0 || r.ignoreIfExists !== void 0) && (o.options = r), s !== void 0 && (o.annotationId = s), o;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return r && r.kind === "create" && w.string(r.uri) && (r.options === void 0 || (r.options.overwrite === void 0 || w.boolean(r.options.overwrite)) && (r.options.ignoreIfExists === void 0 || w.boolean(r.options.ignoreIfExists))) && (r.annotationId === void 0 || Be.is(r.annotationId));
    }
    i.is = t;
})(vn || (vn = {}));
var wn;
(function(i) {
    function e(n, r, s, o) {
        let l = {
            kind: "rename",
            oldUri: n,
            newUri: r
        };
        return s !== void 0 && (s.overwrite !== void 0 || s.ignoreIfExists !== void 0) && (l.options = s), o !== void 0 && (l.annotationId = o), l;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return r && r.kind === "rename" && w.string(r.oldUri) && w.string(r.newUri) && (r.options === void 0 || (r.options.overwrite === void 0 || w.boolean(r.options.overwrite)) && (r.options.ignoreIfExists === void 0 || w.boolean(r.options.ignoreIfExists))) && (r.annotationId === void 0 || Be.is(r.annotationId));
    }
    i.is = t;
})(wn || (wn = {}));
var kn;
(function(i) {
    function e(n, r, s) {
        let o = {
            kind: "delete",
            uri: n
        };
        return r !== void 0 && (r.recursive !== void 0 || r.ignoreIfNotExists !== void 0) && (o.options = r), s !== void 0 && (o.annotationId = s), o;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return r && r.kind === "delete" && w.string(r.uri) && (r.options === void 0 || (r.options.recursive === void 0 || w.boolean(r.options.recursive)) && (r.options.ignoreIfNotExists === void 0 || w.boolean(r.options.ignoreIfNotExists))) && (r.annotationId === void 0 || Be.is(r.annotationId));
    }
    i.is = t;
})(kn || (kn = {}));
var oo;
(function(i) {
    function e(t) {
        let n = t;
        return n && (n.changes !== void 0 || n.documentChanges !== void 0) && (n.documentChanges === void 0 || n.documentChanges.every((r)=>w.string(r.kind) ? vn.is(r) || wn.is(r) || kn.is(r) : Tr.is(r)));
    }
    i.is = e;
})(oo || (oo = {}));
class Ts {
    constructor(e, t){
        this.edits = e, this.changeAnnotations = t;
    }
    insert(e, t, n) {
        let r, s;
        if (n === void 0 ? r = Wt.insert(e, t) : Be.is(n) ? (s = n, r = Xt.insert(e, t, n)) : (this.assertChangeAnnotations(this.changeAnnotations), s = this.changeAnnotations.manage(n), r = Xt.insert(e, t, s)), this.edits.push(r), s !== void 0) return s;
    }
    replace(e, t, n) {
        let r, s;
        if (n === void 0 ? r = Wt.replace(e, t) : Be.is(n) ? (s = n, r = Xt.replace(e, t, n)) : (this.assertChangeAnnotations(this.changeAnnotations), s = this.changeAnnotations.manage(n), r = Xt.replace(e, t, s)), this.edits.push(r), s !== void 0) return s;
    }
    delete(e, t) {
        let n, r;
        if (t === void 0 ? n = Wt.del(e) : Be.is(t) ? (r = t, n = Xt.del(e, t)) : (this.assertChangeAnnotations(this.changeAnnotations), r = this.changeAnnotations.manage(t), n = Xt.del(e, r)), this.edits.push(n), r !== void 0) return r;
    }
    add(e) {
        this.edits.push(e);
    }
    all() {
        return this.edits;
    }
    clear() {
        this.edits.splice(0, this.edits.length);
    }
    assertChangeAnnotations(e) {
        if (e === void 0) throw new Error("Text edit change is not configured to manage change annotations.");
    }
}
class Ju {
    constructor(e){
        this._annotations = e === void 0 ? Object.create(null) : e, this._counter = 0, this._size = 0;
    }
    all() {
        return this._annotations;
    }
    get size() {
        return this._size;
    }
    manage(e, t) {
        let n;
        if (Be.is(e) ? n = e : (n = this.nextId(), t = e), this._annotations[n] !== void 0) throw new Error(`Id ${n} is already in use.`);
        if (t === void 0) throw new Error(`No annotation provided for id ${n}`);
        return this._annotations[n] = t, this._size++, n;
    }
    nextId() {
        return this._counter++, this._counter.toString();
    }
}
class Z1 {
    constructor(e){
        this._textEditChanges = Object.create(null), e !== void 0 ? (this._workspaceEdit = e, e.documentChanges ? (this._changeAnnotations = new Ju(e.changeAnnotations), e.changeAnnotations = this._changeAnnotations.all(), e.documentChanges.forEach((t)=>{
            if (Tr.is(t)) {
                const n = new Ts(t.edits, this._changeAnnotations);
                this._textEditChanges[t.textDocument.uri] = n;
            }
        })) : e.changes && Object.keys(e.changes).forEach((t)=>{
            const n = new Ts(e.changes[t]);
            this._textEditChanges[t] = n;
        })) : this._workspaceEdit = {};
    }
    get edit() {
        return this.initDocumentChanges(), this._changeAnnotations !== void 0 && (this._changeAnnotations.size === 0 ? this._workspaceEdit.changeAnnotations = void 0 : this._workspaceEdit.changeAnnotations = this._changeAnnotations.all()), this._workspaceEdit;
    }
    getTextEditChange(e) {
        if (xr.is(e)) {
            if (this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
            const t = {
                uri: e.uri,
                version: e.version
            };
            let n = this._textEditChanges[t.uri];
            if (!n) {
                const r = [], s = {
                    textDocument: t,
                    edits: r
                };
                this._workspaceEdit.documentChanges.push(s), n = new Ts(r, this._changeAnnotations), this._textEditChanges[t.uri] = n;
            }
            return n;
        } else {
            if (this.initChanges(), this._workspaceEdit.changes === void 0) throw new Error("Workspace edit is not configured for normal text edit changes.");
            let t = this._textEditChanges[e];
            if (!t) {
                let n = [];
                this._workspaceEdit.changes[e] = n, t = new Ts(n), this._textEditChanges[e] = t;
            }
            return t;
        }
    }
    initDocumentChanges() {
        this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0 && (this._changeAnnotations = new Ju, this._workspaceEdit.documentChanges = [], this._workspaceEdit.changeAnnotations = this._changeAnnotations.all());
    }
    initChanges() {
        this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0 && (this._workspaceEdit.changes = Object.create(null));
    }
    createFile(e, t, n) {
        if (this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
        let r;
        Vi.is(t) || Be.is(t) ? r = t : n = t;
        let s, o;
        if (r === void 0 ? s = vn.create(e, n) : (o = Be.is(r) ? r : this._changeAnnotations.manage(r), s = vn.create(e, n, o)), this._workspaceEdit.documentChanges.push(s), o !== void 0) return o;
    }
    renameFile(e, t, n, r) {
        if (this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
        let s;
        Vi.is(n) || Be.is(n) ? s = n : r = n;
        let o, l;
        if (s === void 0 ? o = wn.create(e, t, r) : (l = Be.is(s) ? s : this._changeAnnotations.manage(s), o = wn.create(e, t, r, l)), this._workspaceEdit.documentChanges.push(o), l !== void 0) return l;
    }
    deleteFile(e, t, n) {
        if (this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0) throw new Error("Workspace edit is not configured for document changes.");
        let r;
        Vi.is(t) || Be.is(t) ? r = t : n = t;
        let s, o;
        if (r === void 0 ? s = kn.create(e, n) : (o = Be.is(r) ? r : this._changeAnnotations.manage(r), s = kn.create(e, n, o)), this._workspaceEdit.documentChanges.push(s), o !== void 0) return o;
    }
}
var ba;
(function(i) {
    function e(n) {
        return {
            uri: n
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.string(r.uri);
    }
    i.is = t;
})(ba || (ba = {}));
var va;
(function(i) {
    function e(n, r) {
        return {
            uri: n,
            version: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.string(r.uri) && w.integer(r.version);
    }
    i.is = t;
})(va || (va = {}));
var xr;
(function(i) {
    function e(n, r) {
        return {
            uri: n,
            version: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.string(r.uri) && (r.version === null || w.integer(r.version));
    }
    i.is = t;
})(xr || (xr = {}));
var wa;
(function(i) {
    function e(n, r, s, o) {
        return {
            uri: n,
            languageId: r,
            version: s,
            text: o
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.string(r.uri) && w.string(r.languageId) && w.integer(r.version) && w.string(r.text);
    }
    i.is = t;
})(wa || (wa = {}));
var lo;
(function(i) {
    i.PlainText = "plaintext", i.Markdown = "markdown";
    function e(t) {
        const n = t;
        return n === i.PlainText || n === i.Markdown;
    }
    i.is = e;
})(lo || (lo = {}));
var Sn;
(function(i) {
    function e(t) {
        const n = t;
        return w.objectLiteral(t) && lo.is(n.kind) && w.string(n.value);
    }
    i.is = e;
})(Sn || (Sn = {}));
var ka;
(function(i) {
    i.Text = 1, i.Method = 2, i.Function = 3, i.Constructor = 4, i.Field = 5, i.Variable = 6, i.Class = 7, i.Interface = 8, i.Module = 9, i.Property = 10, i.Unit = 11, i.Value = 12, i.Enum = 13, i.Keyword = 14, i.Snippet = 15, i.Color = 16, i.File = 17, i.Reference = 18, i.Folder = 19, i.EnumMember = 20, i.Constant = 21, i.Struct = 22, i.Event = 23, i.Operator = 24, i.TypeParameter = 25;
})(ka || (ka = {}));
var Sa;
(function(i) {
    i.PlainText = 1, i.Snippet = 2;
})(Sa || (Sa = {}));
var Ca;
(function(i) {
    i.Deprecated = 1;
})(Ca || (Ca = {}));
var Ta;
(function(i) {
    function e(n, r, s) {
        return {
            newText: n,
            insert: r,
            replace: s
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return r && w.string(r.newText) && ve.is(r.insert) && ve.is(r.replace);
    }
    i.is = t;
})(Ta || (Ta = {}));
var xa;
(function(i) {
    i.asIs = 1, i.adjustIndentation = 2;
})(xa || (xa = {}));
var Ra;
(function(i) {
    function e(t) {
        const n = t;
        return n && (w.string(n.detail) || n.detail === void 0) && (w.string(n.description) || n.description === void 0);
    }
    i.is = e;
})(Ra || (Ra = {}));
var Oa;
(function(i) {
    function e(t) {
        return {
            label: t
        };
    }
    i.create = e;
})(Oa || (Oa = {}));
var Da;
(function(i) {
    function e(t, n) {
        return {
            items: t || [],
            isIncomplete: !!n
        };
    }
    i.create = e;
})(Da || (Da = {}));
var Rr;
(function(i) {
    function e(n) {
        return n.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
    }
    i.fromPlainText = e;
    function t(n) {
        const r = n;
        return w.string(r) || w.objectLiteral(r) && w.string(r.language) && w.string(r.value);
    }
    i.is = t;
})(Rr || (Rr = {}));
var Pa;
(function(i) {
    function e(t) {
        let n = t;
        return !!n && w.objectLiteral(n) && (Sn.is(n.contents) || Rr.is(n.contents) || w.typedArray(n.contents, Rr.is)) && (t.range === void 0 || ve.is(t.range));
    }
    i.is = e;
})(Pa || (Pa = {}));
var Ma;
(function(i) {
    function e(t, n) {
        return n ? {
            label: t,
            documentation: n
        } : {
            label: t
        };
    }
    i.create = e;
})(Ma || (Ma = {}));
var Aa;
(function(i) {
    function e(t, n, ...r) {
        let s = {
            label: t
        };
        return w.defined(n) && (s.documentation = n), w.defined(r) ? s.parameters = r : s.parameters = [], s;
    }
    i.create = e;
})(Aa || (Aa = {}));
var _a;
(function(i) {
    i.Text = 1, i.Read = 2, i.Write = 3;
})(_a || (_a = {}));
var Ea;
(function(i) {
    function e(t, n) {
        let r = {
            range: t
        };
        return w.number(n) && (r.kind = n), r;
    }
    i.create = e;
})(Ea || (Ea = {}));
var Na;
(function(i) {
    i.File = 1, i.Module = 2, i.Namespace = 3, i.Package = 4, i.Class = 5, i.Method = 6, i.Property = 7, i.Field = 8, i.Constructor = 9, i.Enum = 10, i.Interface = 11, i.Function = 12, i.Variable = 13, i.Constant = 14, i.String = 15, i.Number = 16, i.Boolean = 17, i.Array = 18, i.Object = 19, i.Key = 20, i.Null = 21, i.EnumMember = 22, i.Struct = 23, i.Event = 24, i.Operator = 25, i.TypeParameter = 26;
})(Na || (Na = {}));
var La;
(function(i) {
    i.Deprecated = 1;
})(La || (La = {}));
var Ba;
(function(i) {
    function e(t, n, r, s, o) {
        let l = {
            name: t,
            kind: n,
            location: {
                uri: s,
                range: r
            }
        };
        return o && (l.containerName = o), l;
    }
    i.create = e;
})(Ba || (Ba = {}));
var Ia;
(function(i) {
    function e(t, n, r, s) {
        return s !== void 0 ? {
            name: t,
            kind: n,
            location: {
                uri: r,
                range: s
            }
        } : {
            name: t,
            kind: n,
            location: {
                uri: r
            }
        };
    }
    i.create = e;
})(Ia || (Ia = {}));
var qa;
(function(i) {
    function e(n, r, s, o, l, a) {
        let c = {
            name: n,
            detail: r,
            kind: s,
            range: o,
            selectionRange: l
        };
        return a !== void 0 && (c.children = a), c;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return r && w.string(r.name) && w.number(r.kind) && ve.is(r.range) && ve.is(r.selectionRange) && (r.detail === void 0 || w.string(r.detail)) && (r.deprecated === void 0 || w.boolean(r.deprecated)) && (r.children === void 0 || Array.isArray(r.children)) && (r.tags === void 0 || Array.isArray(r.tags));
    }
    i.is = t;
})(qa || (qa = {}));
var ja;
(function(i) {
    i.Empty = "", i.QuickFix = "quickfix", i.Refactor = "refactor", i.RefactorExtract = "refactor.extract", i.RefactorInline = "refactor.inline", i.RefactorRewrite = "refactor.rewrite", i.Source = "source", i.SourceOrganizeImports = "source.organizeImports", i.SourceFixAll = "source.fixAll";
})(ja || (ja = {}));
var Or;
(function(i) {
    i.Invoked = 1, i.Automatic = 2;
})(Or || (Or = {}));
var Fa;
(function(i) {
    function e(n, r, s) {
        let o = {
            diagnostics: n
        };
        return r != null && (o.only = r), s != null && (o.triggerKind = s), o;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.typedArray(r.diagnostics, Cr.is) && (r.only === void 0 || w.typedArray(r.only, w.string)) && (r.triggerKind === void 0 || r.triggerKind === Or.Invoked || r.triggerKind === Or.Automatic);
    }
    i.is = t;
})(Fa || (Fa = {}));
var Ha;
(function(i) {
    function e(n, r, s) {
        let o = {
            title: n
        }, l = !0;
        return typeof r == "string" ? (l = !1, o.kind = r) : Ji.is(r) ? o.command = r : o.edit = r, l && s !== void 0 && (o.kind = s), o;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return r && w.string(r.title) && (r.diagnostics === void 0 || w.typedArray(r.diagnostics, Cr.is)) && (r.kind === void 0 || w.string(r.kind)) && (r.edit !== void 0 || r.command !== void 0) && (r.command === void 0 || Ji.is(r.command)) && (r.isPreferred === void 0 || w.boolean(r.isPreferred)) && (r.edit === void 0 || oo.is(r.edit));
    }
    i.is = t;
})(Ha || (Ha = {}));
var Wa;
(function(i) {
    function e(n, r) {
        let s = {
            range: n
        };
        return w.defined(r) && (s.data = r), s;
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && ve.is(r.range) && (w.undefined(r.command) || Ji.is(r.command));
    }
    i.is = t;
})(Wa || (Wa = {}));
var Va;
(function(i) {
    function e(n, r) {
        return {
            tabSize: n,
            insertSpaces: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && w.uinteger(r.tabSize) && w.boolean(r.insertSpaces);
    }
    i.is = t;
})(Va || (Va = {}));
var $a;
(function(i) {
    function e(n, r, s) {
        return {
            range: n,
            target: r,
            data: s
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.defined(r) && ve.is(r.range) && (w.undefined(r.target) || w.string(r.target));
    }
    i.is = t;
})($a || ($a = {}));
var za;
(function(i) {
    function e(n, r) {
        return {
            range: n,
            parent: r
        };
    }
    i.create = e;
    function t(n) {
        let r = n;
        return w.objectLiteral(r) && ve.is(r.range) && (r.parent === void 0 || i.is(r.parent));
    }
    i.is = t;
})(za || (za = {}));
var Ua;
(function(i) {
    i.namespace = "namespace", i.type = "type", i.class = "class", i.enum = "enum", i.interface = "interface", i.struct = "struct", i.typeParameter = "typeParameter", i.parameter = "parameter", i.variable = "variable", i.property = "property", i.enumMember = "enumMember", i.event = "event", i.function = "function", i.method = "method", i.macro = "macro", i.keyword = "keyword", i.modifier = "modifier", i.comment = "comment", i.string = "string", i.number = "number", i.regexp = "regexp", i.operator = "operator", i.decorator = "decorator";
})(Ua || (Ua = {}));
var Ka;
(function(i) {
    i.declaration = "declaration", i.definition = "definition", i.readonly = "readonly", i.static = "static", i.deprecated = "deprecated", i.abstract = "abstract", i.async = "async", i.modification = "modification", i.documentation = "documentation", i.defaultLibrary = "defaultLibrary";
})(Ka || (Ka = {}));
var Ga;
(function(i) {
    function e(t) {
        const n = t;
        return w.objectLiteral(n) && (n.resultId === void 0 || typeof n.resultId == "string") && Array.isArray(n.data) && (n.data.length === 0 || typeof n.data[0] == "number");
    }
    i.is = e;
})(Ga || (Ga = {}));
var Ja;
(function(i) {
    function e(n, r) {
        return {
            range: n,
            text: r
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return r != null && ve.is(r.range) && w.string(r.text);
    }
    i.is = t;
})(Ja || (Ja = {}));
var Qa;
(function(i) {
    function e(n, r, s) {
        return {
            range: n,
            variableName: r,
            caseSensitiveLookup: s
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return r != null && ve.is(r.range) && w.boolean(r.caseSensitiveLookup) && (w.string(r.variableName) || r.variableName === void 0);
    }
    i.is = t;
})(Qa || (Qa = {}));
var Ya;
(function(i) {
    function e(n, r) {
        return {
            range: n,
            expression: r
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return r != null && ve.is(r.range) && (w.string(r.expression) || r.expression === void 0);
    }
    i.is = t;
})(Ya || (Ya = {}));
var Xa;
(function(i) {
    function e(n, r) {
        return {
            frameId: n,
            stoppedLocation: r
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.defined(r) && ve.is(n.stoppedLocation);
    }
    i.is = t;
})(Xa || (Xa = {}));
var ao;
(function(i) {
    i.Type = 1, i.Parameter = 2;
    function e(t) {
        return t === 1 || t === 2;
    }
    i.is = e;
})(ao || (ao = {}));
var co;
(function(i) {
    function e(n) {
        return {
            value: n
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && (r.tooltip === void 0 || w.string(r.tooltip) || Sn.is(r.tooltip)) && (r.location === void 0 || Sr.is(r.location)) && (r.command === void 0 || Ji.is(r.command));
    }
    i.is = t;
})(co || (co = {}));
var Za;
(function(i) {
    function e(n, r, s) {
        const o = {
            position: n,
            label: r
        };
        return s !== void 0 && (o.kind = s), o;
    }
    i.create = e;
    function t(n) {
        const r = n;
        return w.objectLiteral(r) && at.is(r.position) && (w.string(r.label) || w.typedArray(r.label, co.is)) && (r.kind === void 0 || ao.is(r.kind)) && r.textEdits === void 0 || w.typedArray(r.textEdits, Wt.is) && (r.tooltip === void 0 || w.string(r.tooltip) || Sn.is(r.tooltip)) && (r.paddingLeft === void 0 || w.boolean(r.paddingLeft)) && (r.paddingRight === void 0 || w.boolean(r.paddingRight));
    }
    i.is = t;
})(Za || (Za = {}));
var ec;
(function(i) {
    function e(t) {
        return {
            kind: "snippet",
            value: t
        };
    }
    i.createSnippet = e;
})(ec || (ec = {}));
var tc;
(function(i) {
    function e(t, n, r, s) {
        return {
            insertText: t,
            filterText: n,
            range: r,
            command: s
        };
    }
    i.create = e;
})(tc || (tc = {}));
var ic;
(function(i) {
    function e(t) {
        return {
            items: t
        };
    }
    i.create = e;
})(ic || (ic = {}));
var nc;
(function(i) {
    i.Invoked = 0, i.Automatic = 1;
})(nc || (nc = {}));
var rc;
(function(i) {
    function e(t, n) {
        return {
            range: t,
            text: n
        };
    }
    i.create = e;
})(rc || (rc = {}));
var sc;
(function(i) {
    function e(t, n) {
        return {
            triggerKind: t,
            selectedCompletionInfo: n
        };
    }
    i.create = e;
})(sc || (sc = {}));
var oc;
(function(i) {
    function e(t) {
        const n = t;
        return w.objectLiteral(n) && no.is(n.uri) && w.string(n.name);
    }
    i.is = e;
})(oc || (oc = {}));
const ek = [
    `
`,
    `\r
`,
    "\r"
];
var lc;
(function(i) {
    function e(s, o, l, a) {
        return new tk(s, o, l, a);
    }
    i.create = e;
    function t(s) {
        let o = s;
        return !!(w.defined(o) && w.string(o.uri) && (w.undefined(o.languageId) || w.string(o.languageId)) && w.uinteger(o.lineCount) && w.func(o.getText) && w.func(o.positionAt) && w.func(o.offsetAt));
    }
    i.is = t;
    function n(s, o) {
        let l = s.getText(), a = r(o, (h, u)=>{
            let f = h.range.start.line - u.range.start.line;
            return f === 0 ? h.range.start.character - u.range.start.character : f;
        }), c = l.length;
        for(let h = a.length - 1; h >= 0; h--){
            let u = a[h], f = s.offsetAt(u.range.start), d = s.offsetAt(u.range.end);
            if (d <= c) l = l.substring(0, f) + u.newText + l.substring(d, l.length);
            else throw new Error("Overlapping edit");
            c = f;
        }
        return l;
    }
    i.applyEdits = n;
    function r(s, o) {
        if (s.length <= 1) return s;
        const l = s.length / 2 | 0, a = s.slice(0, l), c = s.slice(l);
        r(a, o), r(c, o);
        let h = 0, u = 0, f = 0;
        for(; h < a.length && u < c.length;)o(a[h], c[u]) <= 0 ? s[f++] = a[h++] : s[f++] = c[u++];
        for(; h < a.length;)s[f++] = a[h++];
        for(; u < c.length;)s[f++] = c[u++];
        return s;
    }
})(lc || (lc = {}));
class tk {
    constructor(e, t, n, r){
        this._uri = e, this._languageId = t, this._version = n, this._content = r, this._lineOffsets = void 0;
    }
    get uri() {
        return this._uri;
    }
    get languageId() {
        return this._languageId;
    }
    get version() {
        return this._version;
    }
    getText(e) {
        if (e) {
            let t = this.offsetAt(e.start), n = this.offsetAt(e.end);
            return this._content.substring(t, n);
        }
        return this._content;
    }
    update(e, t) {
        this._content = e.text, this._version = t, this._lineOffsets = void 0;
    }
    getLineOffsets() {
        if (this._lineOffsets === void 0) {
            let e = [], t = this._content, n = !0;
            for(let r = 0; r < t.length; r++){
                n && (e.push(r), n = !1);
                let s = t.charAt(r);
                n = s === "\r" || s === `
`, s === "\r" && r + 1 < t.length && t.charAt(r + 1) === `
` && r++;
            }
            n && t.length > 0 && e.push(t.length), this._lineOffsets = e;
        }
        return this._lineOffsets;
    }
    positionAt(e) {
        e = Math.max(Math.min(e, this._content.length), 0);
        let t = this.getLineOffsets(), n = 0, r = t.length;
        if (r === 0) return at.create(0, e);
        for(; n < r;){
            let o = Math.floor((n + r) / 2);
            t[o] > e ? r = o : n = o + 1;
        }
        let s = n - 1;
        return at.create(s, e - t[s]);
    }
    offsetAt(e) {
        let t = this.getLineOffsets();
        if (e.line >= t.length) return this._content.length;
        if (e.line < 0) return 0;
        let n = t[e.line], r = e.line + 1 < t.length ? t[e.line + 1] : this._content.length;
        return Math.max(Math.min(n + e.character, r), n);
    }
    get lineCount() {
        return this.getLineOffsets().length;
    }
}
var w;
(function(i) {
    const e = Object.prototype.toString;
    function t(d) {
        return typeof d < "u";
    }
    i.defined = t;
    function n(d) {
        return typeof d > "u";
    }
    i.undefined = n;
    function r(d) {
        return d === !0 || d === !1;
    }
    i.boolean = r;
    function s(d) {
        return e.call(d) === "[object String]";
    }
    i.string = s;
    function o(d) {
        return e.call(d) === "[object Number]";
    }
    i.number = o;
    function l(d, p, y) {
        return e.call(d) === "[object Number]" && p <= d && d <= y;
    }
    i.numberRange = l;
    function a(d) {
        return e.call(d) === "[object Number]" && -2147483648 <= d && d <= 2147483647;
    }
    i.integer = a;
    function c(d) {
        return e.call(d) === "[object Number]" && 0 <= d && d <= 2147483647;
    }
    i.uinteger = c;
    function h(d) {
        return e.call(d) === "[object Function]";
    }
    i.func = h;
    function u(d) {
        return d !== null && typeof d == "object";
    }
    i.objectLiteral = u;
    function f(d, p) {
        return Array.isArray(d) && d.every(p);
    }
    i.typedArray = f;
})(w || (w = {}));
const ik = Object.freeze(Object.defineProperty({
    __proto__: null,
    get AnnotatedTextEdit () {
        return Xt;
    },
    get ChangeAnnotation () {
        return Vi;
    },
    get ChangeAnnotationIdentifier () {
        return Be;
    },
    get CodeAction () {
        return Ha;
    },
    get CodeActionContext () {
        return Fa;
    },
    get CodeActionKind () {
        return ja;
    },
    get CodeActionTriggerKind () {
        return Or;
    },
    get CodeDescription () {
        return ya;
    },
    get CodeLens () {
        return Wa;
    },
    get Color () {
        return ro;
    },
    get ColorInformation () {
        return ua;
    },
    get ColorPresentation () {
        return fa;
    },
    get Command () {
        return Ji;
    },
    get CompletionItem () {
        return Oa;
    },
    get CompletionItemKind () {
        return ka;
    },
    get CompletionItemLabelDetails () {
        return Ra;
    },
    get CompletionItemTag () {
        return Ca;
    },
    get CompletionList () {
        return Da;
    },
    get CreateFile () {
        return vn;
    },
    get DeleteFile () {
        return kn;
    },
    get Diagnostic () {
        return Cr;
    },
    get DiagnosticRelatedInformation () {
        return so;
    },
    get DiagnosticSeverity () {
        return ga;
    },
    get DiagnosticTag () {
        return ma;
    },
    get DocumentHighlight () {
        return Ea;
    },
    get DocumentHighlightKind () {
        return _a;
    },
    get DocumentLink () {
        return $a;
    },
    get DocumentSymbol () {
        return qa;
    },
    get DocumentUri () {
        return aa;
    },
    EOL: ek,
    get FoldingRange () {
        return pa;
    },
    get FoldingRangeKind () {
        return da;
    },
    get FormattingOptions () {
        return Va;
    },
    get Hover () {
        return Pa;
    },
    get InlayHint () {
        return Za;
    },
    get InlayHintKind () {
        return ao;
    },
    get InlayHintLabelPart () {
        return co;
    },
    get InlineCompletionContext () {
        return sc;
    },
    get InlineCompletionItem () {
        return tc;
    },
    get InlineCompletionList () {
        return ic;
    },
    get InlineCompletionTriggerKind () {
        return nc;
    },
    get InlineValueContext () {
        return Xa;
    },
    get InlineValueEvaluatableExpression () {
        return Ya;
    },
    get InlineValueText () {
        return Ja;
    },
    get InlineValueVariableLookup () {
        return Qa;
    },
    get InsertReplaceEdit () {
        return Ta;
    },
    get InsertTextFormat () {
        return Sa;
    },
    get InsertTextMode () {
        return xa;
    },
    get Location () {
        return Sr;
    },
    get LocationLink () {
        return ha;
    },
    get MarkedString () {
        return Rr;
    },
    get MarkupContent () {
        return Sn;
    },
    get MarkupKind () {
        return lo;
    },
    get OptionalVersionedTextDocumentIdentifier () {
        return xr;
    },
    get ParameterInformation () {
        return Ma;
    },
    get Position () {
        return at;
    },
    get Range () {
        return ve;
    },
    get RenameFile () {
        return wn;
    },
    get SelectedCompletionInfo () {
        return rc;
    },
    get SelectionRange () {
        return za;
    },
    get SemanticTokenModifiers () {
        return Ka;
    },
    get SemanticTokenTypes () {
        return Ua;
    },
    get SemanticTokens () {
        return Ga;
    },
    get SignatureInformation () {
        return Aa;
    },
    get StringValue () {
        return ec;
    },
    get SymbolInformation () {
        return Ba;
    },
    get SymbolKind () {
        return Na;
    },
    get SymbolTag () {
        return La;
    },
    get TextDocument () {
        return lc;
    },
    get TextDocumentEdit () {
        return Tr;
    },
    get TextDocumentIdentifier () {
        return ba;
    },
    get TextDocumentItem () {
        return wa;
    },
    get TextEdit () {
        return Wt;
    },
    get URI () {
        return no;
    },
    get VersionedTextDocumentIdentifier () {
        return va;
    },
    WorkspaceChange: Z1,
    get WorkspaceEdit () {
        return oo;
    },
    get WorkspaceFolder () {
        return oc;
    },
    get WorkspaceSymbol () {
        return Ia;
    },
    get integer () {
        return ca;
    },
    get uinteger () {
        return kr;
    }
}, Symbol.toStringTag, {
    value: "Module"
})), $c = zg(ik);
var J = {};
Object.defineProperty(J, "__esModule", {
    value: !0
});
J.ProtocolNotificationType = J.ProtocolNotificationType0 = J.ProtocolRequestType = J.ProtocolRequestType0 = J.RegistrationType = J.MessageDirection = void 0;
const Cn = Yi;
var Qu;
(function(i) {
    i.clientToServer = "clientToServer", i.serverToClient = "serverToClient", i.both = "both";
})(Qu || (J.MessageDirection = Qu = {}));
class nk {
    constructor(e){
        this.method = e;
    }
}
J.RegistrationType = nk;
class rk extends Cn.RequestType0 {
    constructor(e){
        super(e);
    }
}
J.ProtocolRequestType0 = rk;
class sk extends Cn.RequestType {
    constructor(e){
        super(e, Cn.ParameterStructures.byName);
    }
}
J.ProtocolRequestType = sk;
class ok extends Cn.NotificationType0 {
    constructor(e){
        super(e);
    }
}
J.ProtocolNotificationType0 = ok;
class lk extends Cn.NotificationType {
    constructor(e){
        super(e, Cn.ParameterStructures.byName);
    }
}
J.ProtocolNotificationType = lk;
var um = {}, be = {};
Object.defineProperty(be, "__esModule", {
    value: !0
});
be.objectLiteral = be.typedArray = be.stringArray = be.array = be.func = be.error = be.number = be.string = be.boolean = void 0;
function ak(i) {
    return i === !0 || i === !1;
}
be.boolean = ak;
function fm(i) {
    return typeof i == "string" || i instanceof String;
}
be.string = fm;
function ck(i) {
    return typeof i == "number" || i instanceof Number;
}
be.number = ck;
function hk(i) {
    return i instanceof Error;
}
be.error = hk;
function uk(i) {
    return typeof i == "function";
}
be.func = uk;
function dm(i) {
    return Array.isArray(i);
}
be.array = dm;
function fk(i) {
    return dm(i) && i.every((e)=>fm(e));
}
be.stringArray = fk;
function dk(i, e) {
    return Array.isArray(i) && i.every(e);
}
be.typedArray = dk;
function pk(i) {
    return i !== null && typeof i == "object";
}
be.objectLiteral = pk;
var Eo = {};
Object.defineProperty(Eo, "__esModule", {
    value: !0
});
Eo.ImplementationRequest = void 0;
const Yu = J;
var Xu;
(function(i) {
    i.method = "textDocument/implementation", i.messageDirection = Yu.MessageDirection.clientToServer, i.type = new Yu.ProtocolRequestType(i.method);
})(Xu || (Eo.ImplementationRequest = Xu = {}));
var No = {};
Object.defineProperty(No, "__esModule", {
    value: !0
});
No.TypeDefinitionRequest = void 0;
const Zu = J;
var ef;
(function(i) {
    i.method = "textDocument/typeDefinition", i.messageDirection = Zu.MessageDirection.clientToServer, i.type = new Zu.ProtocolRequestType(i.method);
})(ef || (No.TypeDefinitionRequest = ef = {}));
var Tn = {};
Object.defineProperty(Tn, "__esModule", {
    value: !0
});
Tn.DidChangeWorkspaceFoldersNotification = Tn.WorkspaceFoldersRequest = void 0;
const ho = J;
var tf;
(function(i) {
    i.method = "workspace/workspaceFolders", i.messageDirection = ho.MessageDirection.serverToClient, i.type = new ho.ProtocolRequestType0(i.method);
})(tf || (Tn.WorkspaceFoldersRequest = tf = {}));
var nf;
(function(i) {
    i.method = "workspace/didChangeWorkspaceFolders", i.messageDirection = ho.MessageDirection.clientToServer, i.type = new ho.ProtocolNotificationType(i.method);
})(nf || (Tn.DidChangeWorkspaceFoldersNotification = nf = {}));
var Lo = {};
Object.defineProperty(Lo, "__esModule", {
    value: !0
});
Lo.ConfigurationRequest = void 0;
const rf = J;
var sf;
(function(i) {
    i.method = "workspace/configuration", i.messageDirection = rf.MessageDirection.serverToClient, i.type = new rf.ProtocolRequestType(i.method);
})(sf || (Lo.ConfigurationRequest = sf = {}));
var xn = {};
Object.defineProperty(xn, "__esModule", {
    value: !0
});
xn.ColorPresentationRequest = xn.DocumentColorRequest = void 0;
const uo = J;
var of;
(function(i) {
    i.method = "textDocument/documentColor", i.messageDirection = uo.MessageDirection.clientToServer, i.type = new uo.ProtocolRequestType(i.method);
})(of || (xn.DocumentColorRequest = of = {}));
var lf;
(function(i) {
    i.method = "textDocument/colorPresentation", i.messageDirection = uo.MessageDirection.clientToServer, i.type = new uo.ProtocolRequestType(i.method);
})(lf || (xn.ColorPresentationRequest = lf = {}));
var Rn = {};
Object.defineProperty(Rn, "__esModule", {
    value: !0
});
Rn.FoldingRangeRefreshRequest = Rn.FoldingRangeRequest = void 0;
const fo = J;
var af;
(function(i) {
    i.method = "textDocument/foldingRange", i.messageDirection = fo.MessageDirection.clientToServer, i.type = new fo.ProtocolRequestType(i.method);
})(af || (Rn.FoldingRangeRequest = af = {}));
var cf;
(function(i) {
    i.method = "workspace/foldingRange/refresh", i.messageDirection = fo.MessageDirection.serverToClient, i.type = new fo.ProtocolRequestType0(i.method);
})(cf || (Rn.FoldingRangeRefreshRequest = cf = {}));
var Bo = {};
Object.defineProperty(Bo, "__esModule", {
    value: !0
});
Bo.DeclarationRequest = void 0;
const hf = J;
var uf;
(function(i) {
    i.method = "textDocument/declaration", i.messageDirection = hf.MessageDirection.clientToServer, i.type = new hf.ProtocolRequestType(i.method);
})(uf || (Bo.DeclarationRequest = uf = {}));
var Io = {};
Object.defineProperty(Io, "__esModule", {
    value: !0
});
Io.SelectionRangeRequest = void 0;
const ff = J;
var df;
(function(i) {
    i.method = "textDocument/selectionRange", i.messageDirection = ff.MessageDirection.clientToServer, i.type = new ff.ProtocolRequestType(i.method);
})(df || (Io.SelectionRangeRequest = df = {}));
var wi = {};
Object.defineProperty(wi, "__esModule", {
    value: !0
});
wi.WorkDoneProgressCancelNotification = wi.WorkDoneProgressCreateRequest = wi.WorkDoneProgress = void 0;
const gk = Yi, po = J;
var pf;
(function(i) {
    i.type = new gk.ProgressType;
    function e(t) {
        return t === i.type;
    }
    i.is = e;
})(pf || (wi.WorkDoneProgress = pf = {}));
var gf;
(function(i) {
    i.method = "window/workDoneProgress/create", i.messageDirection = po.MessageDirection.serverToClient, i.type = new po.ProtocolRequestType(i.method);
})(gf || (wi.WorkDoneProgressCreateRequest = gf = {}));
var mf;
(function(i) {
    i.method = "window/workDoneProgress/cancel", i.messageDirection = po.MessageDirection.clientToServer, i.type = new po.ProtocolNotificationType(i.method);
})(mf || (wi.WorkDoneProgressCancelNotification = mf = {}));
var ki = {};
Object.defineProperty(ki, "__esModule", {
    value: !0
});
ki.CallHierarchyOutgoingCallsRequest = ki.CallHierarchyIncomingCallsRequest = ki.CallHierarchyPrepareRequest = void 0;
const On = J;
var yf;
(function(i) {
    i.method = "textDocument/prepareCallHierarchy", i.messageDirection = On.MessageDirection.clientToServer, i.type = new On.ProtocolRequestType(i.method);
})(yf || (ki.CallHierarchyPrepareRequest = yf = {}));
var bf;
(function(i) {
    i.method = "callHierarchy/incomingCalls", i.messageDirection = On.MessageDirection.clientToServer, i.type = new On.ProtocolRequestType(i.method);
})(bf || (ki.CallHierarchyIncomingCallsRequest = bf = {}));
var vf;
(function(i) {
    i.method = "callHierarchy/outgoingCalls", i.messageDirection = On.MessageDirection.clientToServer, i.type = new On.ProtocolRequestType(i.method);
})(vf || (ki.CallHierarchyOutgoingCallsRequest = vf = {}));
var Qe = {};
Object.defineProperty(Qe, "__esModule", {
    value: !0
});
Qe.SemanticTokensRefreshRequest = Qe.SemanticTokensRangeRequest = Qe.SemanticTokensDeltaRequest = Qe.SemanticTokensRequest = Qe.SemanticTokensRegistrationType = Qe.TokenFormat = void 0;
const si = J;
var wf;
(function(i) {
    i.Relative = "relative";
})(wf || (Qe.TokenFormat = wf = {}));
var Dr;
(function(i) {
    i.method = "textDocument/semanticTokens", i.type = new si.RegistrationType(i.method);
})(Dr || (Qe.SemanticTokensRegistrationType = Dr = {}));
var kf;
(function(i) {
    i.method = "textDocument/semanticTokens/full", i.messageDirection = si.MessageDirection.clientToServer, i.type = new si.ProtocolRequestType(i.method), i.registrationMethod = Dr.method;
})(kf || (Qe.SemanticTokensRequest = kf = {}));
var Sf;
(function(i) {
    i.method = "textDocument/semanticTokens/full/delta", i.messageDirection = si.MessageDirection.clientToServer, i.type = new si.ProtocolRequestType(i.method), i.registrationMethod = Dr.method;
})(Sf || (Qe.SemanticTokensDeltaRequest = Sf = {}));
var Cf;
(function(i) {
    i.method = "textDocument/semanticTokens/range", i.messageDirection = si.MessageDirection.clientToServer, i.type = new si.ProtocolRequestType(i.method), i.registrationMethod = Dr.method;
})(Cf || (Qe.SemanticTokensRangeRequest = Cf = {}));
var Tf;
(function(i) {
    i.method = "workspace/semanticTokens/refresh", i.messageDirection = si.MessageDirection.serverToClient, i.type = new si.ProtocolRequestType0(i.method);
})(Tf || (Qe.SemanticTokensRefreshRequest = Tf = {}));
var qo = {};
Object.defineProperty(qo, "__esModule", {
    value: !0
});
qo.ShowDocumentRequest = void 0;
const xf = J;
var Rf;
(function(i) {
    i.method = "window/showDocument", i.messageDirection = xf.MessageDirection.serverToClient, i.type = new xf.ProtocolRequestType(i.method);
})(Rf || (qo.ShowDocumentRequest = Rf = {}));
var jo = {};
Object.defineProperty(jo, "__esModule", {
    value: !0
});
jo.LinkedEditingRangeRequest = void 0;
const Of = J;
var Df;
(function(i) {
    i.method = "textDocument/linkedEditingRange", i.messageDirection = Of.MessageDirection.clientToServer, i.type = new Of.ProtocolRequestType(i.method);
})(Df || (jo.LinkedEditingRangeRequest = Df = {}));
var Fe = {};
Object.defineProperty(Fe, "__esModule", {
    value: !0
});
Fe.WillDeleteFilesRequest = Fe.DidDeleteFilesNotification = Fe.DidRenameFilesNotification = Fe.WillRenameFilesRequest = Fe.DidCreateFilesNotification = Fe.WillCreateFilesRequest = Fe.FileOperationPatternKind = void 0;
const dt = J;
var Pf;
(function(i) {
    i.file = "file", i.folder = "folder";
})(Pf || (Fe.FileOperationPatternKind = Pf = {}));
var Mf;
(function(i) {
    i.method = "workspace/willCreateFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolRequestType(i.method);
})(Mf || (Fe.WillCreateFilesRequest = Mf = {}));
var Af;
(function(i) {
    i.method = "workspace/didCreateFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolNotificationType(i.method);
})(Af || (Fe.DidCreateFilesNotification = Af = {}));
var _f;
(function(i) {
    i.method = "workspace/willRenameFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolRequestType(i.method);
})(_f || (Fe.WillRenameFilesRequest = _f = {}));
var Ef;
(function(i) {
    i.method = "workspace/didRenameFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolNotificationType(i.method);
})(Ef || (Fe.DidRenameFilesNotification = Ef = {}));
var Nf;
(function(i) {
    i.method = "workspace/didDeleteFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolNotificationType(i.method);
})(Nf || (Fe.DidDeleteFilesNotification = Nf = {}));
var Lf;
(function(i) {
    i.method = "workspace/willDeleteFiles", i.messageDirection = dt.MessageDirection.clientToServer, i.type = new dt.ProtocolRequestType(i.method);
})(Lf || (Fe.WillDeleteFilesRequest = Lf = {}));
var Si = {};
Object.defineProperty(Si, "__esModule", {
    value: !0
});
Si.MonikerRequest = Si.MonikerKind = Si.UniquenessLevel = void 0;
const Bf = J;
var If;
(function(i) {
    i.document = "document", i.project = "project", i.group = "group", i.scheme = "scheme", i.global = "global";
})(If || (Si.UniquenessLevel = If = {}));
var qf;
(function(i) {
    i.$import = "import", i.$export = "export", i.local = "local";
})(qf || (Si.MonikerKind = qf = {}));
var jf;
(function(i) {
    i.method = "textDocument/moniker", i.messageDirection = Bf.MessageDirection.clientToServer, i.type = new Bf.ProtocolRequestType(i.method);
})(jf || (Si.MonikerRequest = jf = {}));
var Ci = {};
Object.defineProperty(Ci, "__esModule", {
    value: !0
});
Ci.TypeHierarchySubtypesRequest = Ci.TypeHierarchySupertypesRequest = Ci.TypeHierarchyPrepareRequest = void 0;
const Dn = J;
var Ff;
(function(i) {
    i.method = "textDocument/prepareTypeHierarchy", i.messageDirection = Dn.MessageDirection.clientToServer, i.type = new Dn.ProtocolRequestType(i.method);
})(Ff || (Ci.TypeHierarchyPrepareRequest = Ff = {}));
var Hf;
(function(i) {
    i.method = "typeHierarchy/supertypes", i.messageDirection = Dn.MessageDirection.clientToServer, i.type = new Dn.ProtocolRequestType(i.method);
})(Hf || (Ci.TypeHierarchySupertypesRequest = Hf = {}));
var Wf;
(function(i) {
    i.method = "typeHierarchy/subtypes", i.messageDirection = Dn.MessageDirection.clientToServer, i.type = new Dn.ProtocolRequestType(i.method);
})(Wf || (Ci.TypeHierarchySubtypesRequest = Wf = {}));
var Pn = {};
Object.defineProperty(Pn, "__esModule", {
    value: !0
});
Pn.InlineValueRefreshRequest = Pn.InlineValueRequest = void 0;
const go = J;
var Vf;
(function(i) {
    i.method = "textDocument/inlineValue", i.messageDirection = go.MessageDirection.clientToServer, i.type = new go.ProtocolRequestType(i.method);
})(Vf || (Pn.InlineValueRequest = Vf = {}));
var $f;
(function(i) {
    i.method = "workspace/inlineValue/refresh", i.messageDirection = go.MessageDirection.serverToClient, i.type = new go.ProtocolRequestType0(i.method);
})($f || (Pn.InlineValueRefreshRequest = $f = {}));
var Ti = {};
Object.defineProperty(Ti, "__esModule", {
    value: !0
});
Ti.InlayHintRefreshRequest = Ti.InlayHintResolveRequest = Ti.InlayHintRequest = void 0;
const Mn = J;
var zf;
(function(i) {
    i.method = "textDocument/inlayHint", i.messageDirection = Mn.MessageDirection.clientToServer, i.type = new Mn.ProtocolRequestType(i.method);
})(zf || (Ti.InlayHintRequest = zf = {}));
var Uf;
(function(i) {
    i.method = "inlayHint/resolve", i.messageDirection = Mn.MessageDirection.clientToServer, i.type = new Mn.ProtocolRequestType(i.method);
})(Uf || (Ti.InlayHintResolveRequest = Uf = {}));
var Kf;
(function(i) {
    i.method = "workspace/inlayHint/refresh", i.messageDirection = Mn.MessageDirection.serverToClient, i.type = new Mn.ProtocolRequestType0(i.method);
})(Kf || (Ti.InlayHintRefreshRequest = Kf = {}));
var ct = {};
Object.defineProperty(ct, "__esModule", {
    value: !0
});
ct.DiagnosticRefreshRequest = ct.WorkspaceDiagnosticRequest = ct.DocumentDiagnosticRequest = ct.DocumentDiagnosticReportKind = ct.DiagnosticServerCancellationData = void 0;
const pm = Yi, mk = be, An = J;
var Gf;
(function(i) {
    function e(t) {
        const n = t;
        return n && mk.boolean(n.retriggerRequest);
    }
    i.is = e;
})(Gf || (ct.DiagnosticServerCancellationData = Gf = {}));
var Jf;
(function(i) {
    i.Full = "full", i.Unchanged = "unchanged";
})(Jf || (ct.DocumentDiagnosticReportKind = Jf = {}));
var Qf;
(function(i) {
    i.method = "textDocument/diagnostic", i.messageDirection = An.MessageDirection.clientToServer, i.type = new An.ProtocolRequestType(i.method), i.partialResult = new pm.ProgressType;
})(Qf || (ct.DocumentDiagnosticRequest = Qf = {}));
var Yf;
(function(i) {
    i.method = "workspace/diagnostic", i.messageDirection = An.MessageDirection.clientToServer, i.type = new An.ProtocolRequestType(i.method), i.partialResult = new pm.ProgressType;
})(Yf || (ct.WorkspaceDiagnosticRequest = Yf = {}));
var Xf;
(function(i) {
    i.method = "workspace/diagnostic/refresh", i.messageDirection = An.MessageDirection.serverToClient, i.type = new An.ProtocolRequestType0(i.method);
})(Xf || (ct.DiagnosticRefreshRequest = Xf = {}));
var ye = {};
Object.defineProperty(ye, "__esModule", {
    value: !0
});
ye.DidCloseNotebookDocumentNotification = ye.DidSaveNotebookDocumentNotification = ye.DidChangeNotebookDocumentNotification = ye.NotebookCellArrayChange = ye.DidOpenNotebookDocumentNotification = ye.NotebookDocumentSyncRegistrationType = ye.NotebookDocument = ye.NotebookCell = ye.ExecutionSummary = ye.NotebookCellKind = void 0;
const Pr = $c, Ct = be, zt = J;
var ac;
(function(i) {
    i.Markup = 1, i.Code = 2;
    function e(t) {
        return t === 1 || t === 2;
    }
    i.is = e;
})(ac || (ye.NotebookCellKind = ac = {}));
var cc;
(function(i) {
    function e(r, s) {
        const o = {
            executionOrder: r
        };
        return (s === !0 || s === !1) && (o.success = s), o;
    }
    i.create = e;
    function t(r) {
        const s = r;
        return Ct.objectLiteral(s) && Pr.uinteger.is(s.executionOrder) && (s.success === void 0 || Ct.boolean(s.success));
    }
    i.is = t;
    function n(r, s) {
        return r === s ? !0 : r == null || s === null || s === void 0 ? !1 : r.executionOrder === s.executionOrder && r.success === s.success;
    }
    i.equals = n;
})(cc || (ye.ExecutionSummary = cc = {}));
var mo;
(function(i) {
    function e(s, o) {
        return {
            kind: s,
            document: o
        };
    }
    i.create = e;
    function t(s) {
        const o = s;
        return Ct.objectLiteral(o) && ac.is(o.kind) && Pr.DocumentUri.is(o.document) && (o.metadata === void 0 || Ct.objectLiteral(o.metadata));
    }
    i.is = t;
    function n(s, o) {
        const l = new Set;
        return s.document !== o.document && l.add("document"), s.kind !== o.kind && l.add("kind"), s.executionSummary !== o.executionSummary && l.add("executionSummary"), (s.metadata !== void 0 || o.metadata !== void 0) && !r(s.metadata, o.metadata) && l.add("metadata"), (s.executionSummary !== void 0 || o.executionSummary !== void 0) && !cc.equals(s.executionSummary, o.executionSummary) && l.add("executionSummary"), l;
    }
    i.diff = n;
    function r(s, o) {
        if (s === o) return !0;
        if (s == null || o === null || o === void 0 || typeof s != typeof o || typeof s != "object") return !1;
        const l = Array.isArray(s), a = Array.isArray(o);
        if (l !== a) return !1;
        if (l && a) {
            if (s.length !== o.length) return !1;
            for(let c = 0; c < s.length; c++)if (!r(s[c], o[c])) return !1;
        }
        if (Ct.objectLiteral(s) && Ct.objectLiteral(o)) {
            const c = Object.keys(s), h = Object.keys(o);
            if (c.length !== h.length || (c.sort(), h.sort(), !r(c, h))) return !1;
            for(let u = 0; u < c.length; u++){
                const f = c[u];
                if (!r(s[f], o[f])) return !1;
            }
        }
        return !0;
    }
})(mo || (ye.NotebookCell = mo = {}));
var Zf;
(function(i) {
    function e(n, r, s, o) {
        return {
            uri: n,
            notebookType: r,
            version: s,
            cells: o
        };
    }
    i.create = e;
    function t(n) {
        const r = n;
        return Ct.objectLiteral(r) && Ct.string(r.uri) && Pr.integer.is(r.version) && Ct.typedArray(r.cells, mo.is);
    }
    i.is = t;
})(Zf || (ye.NotebookDocument = Zf = {}));
var _n;
(function(i) {
    i.method = "notebookDocument/sync", i.messageDirection = zt.MessageDirection.clientToServer, i.type = new zt.RegistrationType(i.method);
})(_n || (ye.NotebookDocumentSyncRegistrationType = _n = {}));
var ed;
(function(i) {
    i.method = "notebookDocument/didOpen", i.messageDirection = zt.MessageDirection.clientToServer, i.type = new zt.ProtocolNotificationType(i.method), i.registrationMethod = _n.method;
})(ed || (ye.DidOpenNotebookDocumentNotification = ed = {}));
var td;
(function(i) {
    function e(n) {
        const r = n;
        return Ct.objectLiteral(r) && Pr.uinteger.is(r.start) && Pr.uinteger.is(r.deleteCount) && (r.cells === void 0 || Ct.typedArray(r.cells, mo.is));
    }
    i.is = e;
    function t(n, r, s) {
        const o = {
            start: n,
            deleteCount: r
        };
        return s !== void 0 && (o.cells = s), o;
    }
    i.create = t;
})(td || (ye.NotebookCellArrayChange = td = {}));
var id;
(function(i) {
    i.method = "notebookDocument/didChange", i.messageDirection = zt.MessageDirection.clientToServer, i.type = new zt.ProtocolNotificationType(i.method), i.registrationMethod = _n.method;
})(id || (ye.DidChangeNotebookDocumentNotification = id = {}));
var nd;
(function(i) {
    i.method = "notebookDocument/didSave", i.messageDirection = zt.MessageDirection.clientToServer, i.type = new zt.ProtocolNotificationType(i.method), i.registrationMethod = _n.method;
})(nd || (ye.DidSaveNotebookDocumentNotification = nd = {}));
var rd;
(function(i) {
    i.method = "notebookDocument/didClose", i.messageDirection = zt.MessageDirection.clientToServer, i.type = new zt.ProtocolNotificationType(i.method), i.registrationMethod = _n.method;
})(rd || (ye.DidCloseNotebookDocumentNotification = rd = {}));
var Fo = {};
Object.defineProperty(Fo, "__esModule", {
    value: !0
});
Fo.InlineCompletionRequest = void 0;
const sd = J;
var od;
(function(i) {
    i.method = "textDocument/inlineCompletion", i.messageDirection = sd.MessageDirection.clientToServer, i.type = new sd.ProtocolRequestType(i.method);
})(od || (Fo.InlineCompletionRequest = od = {}));
(function(i) {
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.WorkspaceSymbolRequest = i.CodeActionResolveRequest = i.CodeActionRequest = i.DocumentSymbolRequest = i.DocumentHighlightRequest = i.ReferencesRequest = i.DefinitionRequest = i.SignatureHelpRequest = i.SignatureHelpTriggerKind = i.HoverRequest = i.CompletionResolveRequest = i.CompletionRequest = i.CompletionTriggerKind = i.PublishDiagnosticsNotification = i.WatchKind = i.RelativePattern = i.FileChangeType = i.DidChangeWatchedFilesNotification = i.WillSaveTextDocumentWaitUntilRequest = i.WillSaveTextDocumentNotification = i.TextDocumentSaveReason = i.DidSaveTextDocumentNotification = i.DidCloseTextDocumentNotification = i.DidChangeTextDocumentNotification = i.TextDocumentContentChangeEvent = i.DidOpenTextDocumentNotification = i.TextDocumentSyncKind = i.TelemetryEventNotification = i.LogMessageNotification = i.ShowMessageRequest = i.ShowMessageNotification = i.MessageType = i.DidChangeConfigurationNotification = i.ExitNotification = i.ShutdownRequest = i.InitializedNotification = i.InitializeErrorCodes = i.InitializeRequest = i.WorkDoneProgressOptions = i.TextDocumentRegistrationOptions = i.StaticRegistrationOptions = i.PositionEncodingKind = i.FailureHandlingKind = i.ResourceOperationKind = i.UnregistrationRequest = i.RegistrationRequest = i.DocumentSelector = i.NotebookCellTextDocumentFilter = i.NotebookDocumentFilter = i.TextDocumentFilter = void 0, i.MonikerRequest = i.MonikerKind = i.UniquenessLevel = i.WillDeleteFilesRequest = i.DidDeleteFilesNotification = i.WillRenameFilesRequest = i.DidRenameFilesNotification = i.WillCreateFilesRequest = i.DidCreateFilesNotification = i.FileOperationPatternKind = i.LinkedEditingRangeRequest = i.ShowDocumentRequest = i.SemanticTokensRegistrationType = i.SemanticTokensRefreshRequest = i.SemanticTokensRangeRequest = i.SemanticTokensDeltaRequest = i.SemanticTokensRequest = i.TokenFormat = i.CallHierarchyPrepareRequest = i.CallHierarchyOutgoingCallsRequest = i.CallHierarchyIncomingCallsRequest = i.WorkDoneProgressCancelNotification = i.WorkDoneProgressCreateRequest = i.WorkDoneProgress = i.SelectionRangeRequest = i.DeclarationRequest = i.FoldingRangeRefreshRequest = i.FoldingRangeRequest = i.ColorPresentationRequest = i.DocumentColorRequest = i.ConfigurationRequest = i.DidChangeWorkspaceFoldersNotification = i.WorkspaceFoldersRequest = i.TypeDefinitionRequest = i.ImplementationRequest = i.ApplyWorkspaceEditRequest = i.ExecuteCommandRequest = i.PrepareRenameRequest = i.RenameRequest = i.PrepareSupportDefaultBehavior = i.DocumentOnTypeFormattingRequest = i.DocumentRangesFormattingRequest = i.DocumentRangeFormattingRequest = i.DocumentFormattingRequest = i.DocumentLinkResolveRequest = i.DocumentLinkRequest = i.CodeLensRefreshRequest = i.CodeLensResolveRequest = i.CodeLensRequest = i.WorkspaceSymbolResolveRequest = void 0, i.InlineCompletionRequest = i.DidCloseNotebookDocumentNotification = i.DidSaveNotebookDocumentNotification = i.DidChangeNotebookDocumentNotification = i.NotebookCellArrayChange = i.DidOpenNotebookDocumentNotification = i.NotebookDocumentSyncRegistrationType = i.NotebookDocument = i.NotebookCell = i.ExecutionSummary = i.NotebookCellKind = i.DiagnosticRefreshRequest = i.WorkspaceDiagnosticRequest = i.DocumentDiagnosticRequest = i.DocumentDiagnosticReportKind = i.DiagnosticServerCancellationData = i.InlayHintRefreshRequest = i.InlayHintResolveRequest = i.InlayHintRequest = i.InlineValueRefreshRequest = i.InlineValueRequest = i.TypeHierarchySupertypesRequest = i.TypeHierarchySubtypesRequest = i.TypeHierarchyPrepareRequest = void 0;
    const e = J, t = $c, n = be, r = Eo;
    Object.defineProperty(i, "ImplementationRequest", {
        enumerable: !0,
        get: function() {
            return r.ImplementationRequest;
        }
    });
    const s = No;
    Object.defineProperty(i, "TypeDefinitionRequest", {
        enumerable: !0,
        get: function() {
            return s.TypeDefinitionRequest;
        }
    });
    const o = Tn;
    Object.defineProperty(i, "WorkspaceFoldersRequest", {
        enumerable: !0,
        get: function() {
            return o.WorkspaceFoldersRequest;
        }
    }), Object.defineProperty(i, "DidChangeWorkspaceFoldersNotification", {
        enumerable: !0,
        get: function() {
            return o.DidChangeWorkspaceFoldersNotification;
        }
    });
    const l = Lo;
    Object.defineProperty(i, "ConfigurationRequest", {
        enumerable: !0,
        get: function() {
            return l.ConfigurationRequest;
        }
    });
    const a = xn;
    Object.defineProperty(i, "DocumentColorRequest", {
        enumerable: !0,
        get: function() {
            return a.DocumentColorRequest;
        }
    }), Object.defineProperty(i, "ColorPresentationRequest", {
        enumerable: !0,
        get: function() {
            return a.ColorPresentationRequest;
        }
    });
    const c = Rn;
    Object.defineProperty(i, "FoldingRangeRequest", {
        enumerable: !0,
        get: function() {
            return c.FoldingRangeRequest;
        }
    }), Object.defineProperty(i, "FoldingRangeRefreshRequest", {
        enumerable: !0,
        get: function() {
            return c.FoldingRangeRefreshRequest;
        }
    });
    const h = Bo;
    Object.defineProperty(i, "DeclarationRequest", {
        enumerable: !0,
        get: function() {
            return h.DeclarationRequest;
        }
    });
    const u = Io;
    Object.defineProperty(i, "SelectionRangeRequest", {
        enumerable: !0,
        get: function() {
            return u.SelectionRangeRequest;
        }
    });
    const f = wi;
    Object.defineProperty(i, "WorkDoneProgress", {
        enumerable: !0,
        get: function() {
            return f.WorkDoneProgress;
        }
    }), Object.defineProperty(i, "WorkDoneProgressCreateRequest", {
        enumerable: !0,
        get: function() {
            return f.WorkDoneProgressCreateRequest;
        }
    }), Object.defineProperty(i, "WorkDoneProgressCancelNotification", {
        enumerable: !0,
        get: function() {
            return f.WorkDoneProgressCancelNotification;
        }
    });
    const d = ki;
    Object.defineProperty(i, "CallHierarchyIncomingCallsRequest", {
        enumerable: !0,
        get: function() {
            return d.CallHierarchyIncomingCallsRequest;
        }
    }), Object.defineProperty(i, "CallHierarchyOutgoingCallsRequest", {
        enumerable: !0,
        get: function() {
            return d.CallHierarchyOutgoingCallsRequest;
        }
    }), Object.defineProperty(i, "CallHierarchyPrepareRequest", {
        enumerable: !0,
        get: function() {
            return d.CallHierarchyPrepareRequest;
        }
    });
    const p = Qe;
    Object.defineProperty(i, "TokenFormat", {
        enumerable: !0,
        get: function() {
            return p.TokenFormat;
        }
    }), Object.defineProperty(i, "SemanticTokensRequest", {
        enumerable: !0,
        get: function() {
            return p.SemanticTokensRequest;
        }
    }), Object.defineProperty(i, "SemanticTokensDeltaRequest", {
        enumerable: !0,
        get: function() {
            return p.SemanticTokensDeltaRequest;
        }
    }), Object.defineProperty(i, "SemanticTokensRangeRequest", {
        enumerable: !0,
        get: function() {
            return p.SemanticTokensRangeRequest;
        }
    }), Object.defineProperty(i, "SemanticTokensRefreshRequest", {
        enumerable: !0,
        get: function() {
            return p.SemanticTokensRefreshRequest;
        }
    }), Object.defineProperty(i, "SemanticTokensRegistrationType", {
        enumerable: !0,
        get: function() {
            return p.SemanticTokensRegistrationType;
        }
    });
    const y = qo;
    Object.defineProperty(i, "ShowDocumentRequest", {
        enumerable: !0,
        get: function() {
            return y.ShowDocumentRequest;
        }
    });
    const b = jo;
    Object.defineProperty(i, "LinkedEditingRangeRequest", {
        enumerable: !0,
        get: function() {
            return b.LinkedEditingRangeRequest;
        }
    });
    const k = Fe;
    Object.defineProperty(i, "FileOperationPatternKind", {
        enumerable: !0,
        get: function() {
            return k.FileOperationPatternKind;
        }
    }), Object.defineProperty(i, "DidCreateFilesNotification", {
        enumerable: !0,
        get: function() {
            return k.DidCreateFilesNotification;
        }
    }), Object.defineProperty(i, "WillCreateFilesRequest", {
        enumerable: !0,
        get: function() {
            return k.WillCreateFilesRequest;
        }
    }), Object.defineProperty(i, "DidRenameFilesNotification", {
        enumerable: !0,
        get: function() {
            return k.DidRenameFilesNotification;
        }
    }), Object.defineProperty(i, "WillRenameFilesRequest", {
        enumerable: !0,
        get: function() {
            return k.WillRenameFilesRequest;
        }
    }), Object.defineProperty(i, "DidDeleteFilesNotification", {
        enumerable: !0,
        get: function() {
            return k.DidDeleteFilesNotification;
        }
    }), Object.defineProperty(i, "WillDeleteFilesRequest", {
        enumerable: !0,
        get: function() {
            return k.WillDeleteFilesRequest;
        }
    });
    const T = Si;
    Object.defineProperty(i, "UniquenessLevel", {
        enumerable: !0,
        get: function() {
            return T.UniquenessLevel;
        }
    }), Object.defineProperty(i, "MonikerKind", {
        enumerable: !0,
        get: function() {
            return T.MonikerKind;
        }
    }), Object.defineProperty(i, "MonikerRequest", {
        enumerable: !0,
        get: function() {
            return T.MonikerRequest;
        }
    });
    const D = Ci;
    Object.defineProperty(i, "TypeHierarchyPrepareRequest", {
        enumerable: !0,
        get: function() {
            return D.TypeHierarchyPrepareRequest;
        }
    }), Object.defineProperty(i, "TypeHierarchySubtypesRequest", {
        enumerable: !0,
        get: function() {
            return D.TypeHierarchySubtypesRequest;
        }
    }), Object.defineProperty(i, "TypeHierarchySupertypesRequest", {
        enumerable: !0,
        get: function() {
            return D.TypeHierarchySupertypesRequest;
        }
    });
    const S = Pn;
    Object.defineProperty(i, "InlineValueRequest", {
        enumerable: !0,
        get: function() {
            return S.InlineValueRequest;
        }
    }), Object.defineProperty(i, "InlineValueRefreshRequest", {
        enumerable: !0,
        get: function() {
            return S.InlineValueRefreshRequest;
        }
    });
    const x = Ti;
    Object.defineProperty(i, "InlayHintRequest", {
        enumerable: !0,
        get: function() {
            return x.InlayHintRequest;
        }
    }), Object.defineProperty(i, "InlayHintResolveRequest", {
        enumerable: !0,
        get: function() {
            return x.InlayHintResolveRequest;
        }
    }), Object.defineProperty(i, "InlayHintRefreshRequest", {
        enumerable: !0,
        get: function() {
            return x.InlayHintRefreshRequest;
        }
    });
    const R = ct;
    Object.defineProperty(i, "DiagnosticServerCancellationData", {
        enumerable: !0,
        get: function() {
            return R.DiagnosticServerCancellationData;
        }
    }), Object.defineProperty(i, "DocumentDiagnosticReportKind", {
        enumerable: !0,
        get: function() {
            return R.DocumentDiagnosticReportKind;
        }
    }), Object.defineProperty(i, "DocumentDiagnosticRequest", {
        enumerable: !0,
        get: function() {
            return R.DocumentDiagnosticRequest;
        }
    }), Object.defineProperty(i, "WorkspaceDiagnosticRequest", {
        enumerable: !0,
        get: function() {
            return R.WorkspaceDiagnosticRequest;
        }
    }), Object.defineProperty(i, "DiagnosticRefreshRequest", {
        enumerable: !0,
        get: function() {
            return R.DiagnosticRefreshRequest;
        }
    });
    const E = ye;
    Object.defineProperty(i, "NotebookCellKind", {
        enumerable: !0,
        get: function() {
            return E.NotebookCellKind;
        }
    }), Object.defineProperty(i, "ExecutionSummary", {
        enumerable: !0,
        get: function() {
            return E.ExecutionSummary;
        }
    }), Object.defineProperty(i, "NotebookCell", {
        enumerable: !0,
        get: function() {
            return E.NotebookCell;
        }
    }), Object.defineProperty(i, "NotebookDocument", {
        enumerable: !0,
        get: function() {
            return E.NotebookDocument;
        }
    }), Object.defineProperty(i, "NotebookDocumentSyncRegistrationType", {
        enumerable: !0,
        get: function() {
            return E.NotebookDocumentSyncRegistrationType;
        }
    }), Object.defineProperty(i, "DidOpenNotebookDocumentNotification", {
        enumerable: !0,
        get: function() {
            return E.DidOpenNotebookDocumentNotification;
        }
    }), Object.defineProperty(i, "NotebookCellArrayChange", {
        enumerable: !0,
        get: function() {
            return E.NotebookCellArrayChange;
        }
    }), Object.defineProperty(i, "DidChangeNotebookDocumentNotification", {
        enumerable: !0,
        get: function() {
            return E.DidChangeNotebookDocumentNotification;
        }
    }), Object.defineProperty(i, "DidSaveNotebookDocumentNotification", {
        enumerable: !0,
        get: function() {
            return E.DidSaveNotebookDocumentNotification;
        }
    }), Object.defineProperty(i, "DidCloseNotebookDocumentNotification", {
        enumerable: !0,
        get: function() {
            return E.DidCloseNotebookDocumentNotification;
        }
    });
    const K = Fo;
    Object.defineProperty(i, "InlineCompletionRequest", {
        enumerable: !0,
        get: function() {
            return K.InlineCompletionRequest;
        }
    });
    var W;
    (function(g) {
        function we(ke) {
            const z = ke;
            return n.string(z) || n.string(z.language) || n.string(z.scheme) || n.string(z.pattern);
        }
        g.is = we;
    })(W || (i.TextDocumentFilter = W = {}));
    var U;
    (function(g) {
        function we(ke) {
            const z = ke;
            return n.objectLiteral(z) && (n.string(z.notebookType) || n.string(z.scheme) || n.string(z.pattern));
        }
        g.is = we;
    })(U || (i.NotebookDocumentFilter = U = {}));
    var G;
    (function(g) {
        function we(ke) {
            const z = ke;
            return n.objectLiteral(z) && (n.string(z.notebook) || U.is(z.notebook)) && (z.language === void 0 || n.string(z.language));
        }
        g.is = we;
    })(G || (i.NotebookCellTextDocumentFilter = G = {}));
    var L;
    (function(g) {
        function we(ke) {
            if (!Array.isArray(ke)) return !1;
            for (let z of ke)if (!n.string(z) && !W.is(z) && !G.is(z)) return !1;
            return !0;
        }
        g.is = we;
    })(L || (i.DocumentSelector = L = {}));
    var v;
    (function(g) {
        g.method = "client/registerCapability", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolRequestType(g.method);
    })(v || (i.RegistrationRequest = v = {}));
    var N;
    (function(g) {
        g.method = "client/unregisterCapability", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolRequestType(g.method);
    })(N || (i.UnregistrationRequest = N = {}));
    var B;
    (function(g) {
        g.Create = "create", g.Rename = "rename", g.Delete = "delete";
    })(B || (i.ResourceOperationKind = B = {}));
    var _;
    (function(g) {
        g.Abort = "abort", g.Transactional = "transactional", g.TextOnlyTransactional = "textOnlyTransactional", g.Undo = "undo";
    })(_ || (i.FailureHandlingKind = _ = {}));
    var V;
    (function(g) {
        g.UTF8 = "utf-8", g.UTF16 = "utf-16", g.UTF32 = "utf-32";
    })(V || (i.PositionEncodingKind = V = {}));
    var xe;
    (function(g) {
        function we(ke) {
            const z = ke;
            return z && n.string(z.id) && z.id.length > 0;
        }
        g.hasId = we;
    })(xe || (i.StaticRegistrationOptions = xe = {}));
    var ae;
    (function(g) {
        function we(ke) {
            const z = ke;
            return z && (z.documentSelector === null || L.is(z.documentSelector));
        }
        g.is = we;
    })(ae || (i.TextDocumentRegistrationOptions = ae = {}));
    var de;
    (function(g) {
        function we(z) {
            const m = z;
            return n.objectLiteral(m) && (m.workDoneProgress === void 0 || n.boolean(m.workDoneProgress));
        }
        g.is = we;
        function ke(z) {
            const m = z;
            return m && n.boolean(m.workDoneProgress);
        }
        g.hasWorkDoneProgress = ke;
    })(de || (i.WorkDoneProgressOptions = de = {}));
    var qe;
    (function(g) {
        g.method = "initialize", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(qe || (i.InitializeRequest = qe = {}));
    var $e;
    (function(g) {
        g.unknownProtocolVersion = 1;
    })($e || (i.InitializeErrorCodes = $e = {}));
    var ot;
    (function(g) {
        g.method = "initialized", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(ot || (i.InitializedNotification = ot = {}));
    var mt;
    (function(g) {
        g.method = "shutdown", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType0(g.method);
    })(mt || (i.ShutdownRequest = mt = {}));
    var Ai;
    (function(g) {
        g.method = "exit", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType0(g.method);
    })(Ai || (i.ExitNotification = Ai = {}));
    var _i;
    (function(g) {
        g.method = "workspace/didChangeConfiguration", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(_i || (i.DidChangeConfigurationNotification = _i = {}));
    var Zi;
    (function(g) {
        g.Error = 1, g.Warning = 2, g.Info = 3, g.Log = 4, g.Debug = 5;
    })(Zi || (i.MessageType = Zi = {}));
    var Ot;
    (function(g) {
        g.method = "window/showMessage", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolNotificationType(g.method);
    })(Ot || (i.ShowMessageNotification = Ot = {}));
    var Dt;
    (function(g) {
        g.method = "window/showMessageRequest", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolRequestType(g.method);
    })(Dt || (i.ShowMessageRequest = Dt = {}));
    var Ei;
    (function(g) {
        g.method = "window/logMessage", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolNotificationType(g.method);
    })(Ei || (i.LogMessageNotification = Ei = {}));
    var lt;
    (function(g) {
        g.method = "telemetry/event", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolNotificationType(g.method);
    })(lt || (i.TelemetryEventNotification = lt = {}));
    var ne;
    (function(g) {
        g.None = 0, g.Full = 1, g.Incremental = 2;
    })(ne || (i.TextDocumentSyncKind = ne = {}));
    var Pt;
    (function(g) {
        g.method = "textDocument/didOpen", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(Pt || (i.DidOpenTextDocumentNotification = Pt = {}));
    var me;
    (function(g) {
        function we(z) {
            let m = z;
            return m != null && typeof m.text == "string" && m.range !== void 0 && (m.rangeLength === void 0 || typeof m.rangeLength == "number");
        }
        g.isIncremental = we;
        function ke(z) {
            let m = z;
            return m != null && typeof m.text == "string" && m.range === void 0 && m.rangeLength === void 0;
        }
        g.isFull = ke;
    })(me || (i.TextDocumentContentChangeEvent = me = {}));
    var yt;
    (function(g) {
        g.method = "textDocument/didChange", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(yt || (i.DidChangeTextDocumentNotification = yt = {}));
    var en;
    (function(g) {
        g.method = "textDocument/didClose", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(en || (i.DidCloseTextDocumentNotification = en = {}));
    var qn;
    (function(g) {
        g.method = "textDocument/didSave", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(qn || (i.DidSaveTextDocumentNotification = qn = {}));
    var jn;
    (function(g) {
        g.Manual = 1, g.AfterDelay = 2, g.FocusOut = 3;
    })(jn || (i.TextDocumentSaveReason = jn = {}));
    var Fn;
    (function(g) {
        g.method = "textDocument/willSave", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(Fn || (i.WillSaveTextDocumentNotification = Fn = {}));
    var Hn;
    (function(g) {
        g.method = "textDocument/willSaveWaitUntil", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Hn || (i.WillSaveTextDocumentWaitUntilRequest = Hn = {}));
    var bt;
    (function(g) {
        g.method = "workspace/didChangeWatchedFiles", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolNotificationType(g.method);
    })(bt || (i.DidChangeWatchedFilesNotification = bt = {}));
    var Wn;
    (function(g) {
        g.Created = 1, g.Changed = 2, g.Deleted = 3;
    })(Wn || (i.FileChangeType = Wn = {}));
    var Fr;
    (function(g) {
        function we(ke) {
            const z = ke;
            return n.objectLiteral(z) && (t.URI.is(z.baseUri) || t.WorkspaceFolder.is(z.baseUri)) && n.string(z.pattern);
        }
        g.is = we;
    })(Fr || (i.RelativePattern = Fr = {}));
    var Hr;
    (function(g) {
        g.Create = 1, g.Change = 2, g.Delete = 4;
    })(Hr || (i.WatchKind = Hr = {}));
    var Wr;
    (function(g) {
        g.method = "textDocument/publishDiagnostics", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolNotificationType(g.method);
    })(Wr || (i.PublishDiagnosticsNotification = Wr = {}));
    var Vr;
    (function(g) {
        g.Invoked = 1, g.TriggerCharacter = 2, g.TriggerForIncompleteCompletions = 3;
    })(Vr || (i.CompletionTriggerKind = Vr = {}));
    var Vn;
    (function(g) {
        g.method = "textDocument/completion", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Vn || (i.CompletionRequest = Vn = {}));
    var $n;
    (function(g) {
        g.method = "completionItem/resolve", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })($n || (i.CompletionResolveRequest = $n = {}));
    var Kt;
    (function(g) {
        g.method = "textDocument/hover", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Kt || (i.HoverRequest = Kt = {}));
    var zn;
    (function(g) {
        g.Invoked = 1, g.TriggerCharacter = 2, g.ContentChange = 3;
    })(zn || (i.SignatureHelpTriggerKind = zn = {}));
    var $r;
    (function(g) {
        g.method = "textDocument/signatureHelp", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })($r || (i.SignatureHelpRequest = $r = {}));
    var zr;
    (function(g) {
        g.method = "textDocument/definition", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(zr || (i.DefinitionRequest = zr = {}));
    var Un;
    (function(g) {
        g.method = "textDocument/references", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Un || (i.ReferencesRequest = Un = {}));
    var Kn;
    (function(g) {
        g.method = "textDocument/documentHighlight", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Kn || (i.DocumentHighlightRequest = Kn = {}));
    var Ur;
    (function(g) {
        g.method = "textDocument/documentSymbol", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Ur || (i.DocumentSymbolRequest = Ur = {}));
    var Kr;
    (function(g) {
        g.method = "textDocument/codeAction", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Kr || (i.CodeActionRequest = Kr = {}));
    var Gr;
    (function(g) {
        g.method = "codeAction/resolve", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Gr || (i.CodeActionResolveRequest = Gr = {}));
    var Jr;
    (function(g) {
        g.method = "workspace/symbol", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Jr || (i.WorkspaceSymbolRequest = Jr = {}));
    var Qr;
    (function(g) {
        g.method = "workspaceSymbol/resolve", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Qr || (i.WorkspaceSymbolResolveRequest = Qr = {}));
    var Yr;
    (function(g) {
        g.method = "textDocument/codeLens", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Yr || (i.CodeLensRequest = Yr = {}));
    var vt;
    (function(g) {
        g.method = "codeLens/resolve", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(vt || (i.CodeLensResolveRequest = vt = {}));
    var Xr;
    (function(g) {
        g.method = "workspace/codeLens/refresh", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolRequestType0(g.method);
    })(Xr || (i.CodeLensRefreshRequest = Xr = {}));
    var Zr;
    (function(g) {
        g.method = "textDocument/documentLink", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Zr || (i.DocumentLinkRequest = Zr = {}));
    var Ni;
    (function(g) {
        g.method = "documentLink/resolve", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Ni || (i.DocumentLinkResolveRequest = Ni = {}));
    var es;
    (function(g) {
        g.method = "textDocument/formatting", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(es || (i.DocumentFormattingRequest = es = {}));
    var tn;
    (function(g) {
        g.method = "textDocument/rangeFormatting", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(tn || (i.DocumentRangeFormattingRequest = tn = {}));
    var ts;
    (function(g) {
        g.method = "textDocument/rangesFormatting", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(ts || (i.DocumentRangesFormattingRequest = ts = {}));
    var Gt;
    (function(g) {
        g.method = "textDocument/onTypeFormatting", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(Gt || (i.DocumentOnTypeFormattingRequest = Gt = {}));
    var ai;
    (function(g) {
        g.Identifier = 1;
    })(ai || (i.PrepareSupportDefaultBehavior = ai = {}));
    var is;
    (function(g) {
        g.method = "textDocument/rename", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(is || (i.RenameRequest = is = {}));
    var ns;
    (function(g) {
        g.method = "textDocument/prepareRename", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(ns || (i.PrepareRenameRequest = ns = {}));
    var ci;
    (function(g) {
        g.method = "workspace/executeCommand", g.messageDirection = e.MessageDirection.clientToServer, g.type = new e.ProtocolRequestType(g.method);
    })(ci || (i.ExecuteCommandRequest = ci = {}));
    var Gn;
    (function(g) {
        g.method = "workspace/applyEdit", g.messageDirection = e.MessageDirection.serverToClient, g.type = new e.ProtocolRequestType("workspace/applyEdit");
    })(Gn || (i.ApplyWorkspaceEditRequest = Gn = {}));
})(um);
var Ho = {};
Object.defineProperty(Ho, "__esModule", {
    value: !0
});
Ho.createProtocolConnection = void 0;
const ld = Yi;
function yk(i, e, t, n) {
    return ld.ConnectionStrategy.is(n) && (n = {
        connectionStrategy: n
    }), (0, ld.createMessageConnection)(i, e, t, n);
}
Ho.createProtocolConnection = yk;
(function(i) {
    var e = H && H.__createBinding || (Object.create ? function(s, o, l, a) {
        a === void 0 && (a = l);
        var c = Object.getOwnPropertyDescriptor(o, l);
        (!c || ("get" in c ? !o.__esModule : c.writable || c.configurable)) && (c = {
            enumerable: !0,
            get: function() {
                return o[l];
            }
        }), Object.defineProperty(s, a, c);
    } : function(s, o, l, a) {
        a === void 0 && (a = l), s[a] = o[l];
    }), t = H && H.__exportStar || function(s, o) {
        for(var l in s)l !== "default" && !Object.prototype.hasOwnProperty.call(o, l) && e(o, s, l);
    };
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.LSPErrorCodes = i.createProtocolConnection = void 0, t(Yi, i), t($c, i), t(J, i), t(um, i);
    var n = Ho;
    Object.defineProperty(i, "createProtocolConnection", {
        enumerable: !0,
        get: function() {
            return n.createProtocolConnection;
        }
    });
    var r;
    (function(s) {
        s.lspReservedErrorRangeStart = -32899, s.RequestFailed = -32803, s.ServerCancelled = -32802, s.ContentModified = -32801, s.RequestCancelled = -32800, s.lspReservedErrorRangeEnd = -32800;
    })(r || (i.LSPErrorCodes = r = {}));
})(hm);
(function(i) {
    var e = H && H.__createBinding || (Object.create ? function(s, o, l, a) {
        a === void 0 && (a = l);
        var c = Object.getOwnPropertyDescriptor(o, l);
        (!c || ("get" in c ? !o.__esModule : c.writable || c.configurable)) && (c = {
            enumerable: !0,
            get: function() {
                return o[l];
            }
        }), Object.defineProperty(s, a, c);
    } : function(s, o, l, a) {
        a === void 0 && (a = l), s[a] = o[l];
    }), t = H && H.__exportStar || function(s, o) {
        for(var l in s)l !== "default" && !Object.prototype.hasOwnProperty.call(o, l) && e(o, s, l);
    };
    Object.defineProperty(i, "__esModule", {
        value: !0
    }), i.createProtocolConnection = void 0;
    const n = Gu;
    t(Gu, i), t(hm, i);
    function r(s, o, l, a) {
        return (0, n.createMessageConnection)(s, o, l, a);
    }
    i.createProtocolConnection = r;
})(ti);
const fl = 1e4, bk = 500, vk = Object.fromEntries(Object.entries(ti.CompletionItemKind).map(([i, e])=>[
        e,
        i
    ])), zc = (i)=>i.reduce((e, t)=>t, ""), gm = q.define({
    combine: zc
}), mm = q.define({
    combine: zc
}), ym = q.define({
    combine: zc
});
class wk {
    constructor(e){
        this.rootUri = e.rootUri, this.workspaceFolders = e.workspaceFolders, this.autoClose = e.autoClose, this.plugins = [], this.transport = e.transport, this.requestManager = new io.RequestManager([
            this.transport
        ]), this.client = new io.Client(this.requestManager), this.client.onNotification((n)=>{
            this.processNotification(n);
        });
        const t = this.transport;
        t && t.connection && t.connection.addEventListener("message", (n)=>{
            const r = JSON.parse(n.data);
            r.method && r.id && t.connection.send(JSON.stringify({
                jsonrpc: "2.0",
                id: r.id,
                result: null
            }));
        }), this.initializePromise = this.initialize();
    }
    async initialize() {
        const { capabilities: e } = await this.request("initialize", {
            capabilities: {
                textDocument: {
                    hover: {
                        dynamicRegistration: !0,
                        contentFormat: [
                            "plaintext",
                            "markdown"
                        ]
                    },
                    moniker: {},
                    synchronization: {
                        dynamicRegistration: !0,
                        willSave: !1,
                        didSave: !1,
                        willSaveWaitUntil: !1
                    },
                    completion: {
                        dynamicRegistration: !0,
                        completionItem: {
                            snippetSupport: !1,
                            commitCharactersSupport: !0,
                            documentationFormat: [
                                "plaintext",
                                "markdown"
                            ],
                            deprecatedSupport: !1,
                            preselectSupport: !1
                        },
                        contextSupport: !1
                    },
                    signatureHelp: {
                        dynamicRegistration: !0,
                        signatureInformation: {
                            documentationFormat: [
                                "plaintext",
                                "markdown"
                            ]
                        }
                    },
                    declaration: {
                        dynamicRegistration: !0,
                        linkSupport: !0
                    },
                    definition: {
                        dynamicRegistration: !0,
                        linkSupport: !0
                    },
                    typeDefinition: {
                        dynamicRegistration: !0,
                        linkSupport: !0
                    },
                    implementation: {
                        dynamicRegistration: !0,
                        linkSupport: !0
                    }
                },
                workspace: {
                    didChangeConfiguration: {
                        dynamicRegistration: !0
                    }
                }
            },
            initializationOptions: null,
            processId: null,
            rootUri: this.rootUri,
            workspaceFolders: this.workspaceFolders
        }, fl * 3);
        this.capabilities = e, this.notify("initialized", {}), this.ready = !0;
    }
    close() {
        this.client.close();
    }
    textDocumentDidOpen(e) {
        return this.notify("textDocument/didOpen", e);
    }
    textDocumentDidChange(e) {
        return this.notify("textDocument/didChange", e);
    }
    async textDocumentHover(e) {
        return await this.request("textDocument/hover", e, fl);
    }
    async textDocumentCompletion(e) {
        return await this.request("textDocument/completion", e, fl);
    }
    attachPlugin(e) {
        this.plugins.push(e);
    }
    detachPlugin(e) {
        const t = this.plugins.indexOf(e);
        t !== -1 && (this.plugins.splice(t, 1), this.autoClose && this.close());
    }
    request(e, t, n) {
        return this.client.request({
            method: e,
            params: t
        }, n);
    }
    notify(e, t) {
        return this.client.notify({
            method: e,
            params: t
        });
    }
    processNotification(e) {
        for (const t of this.plugins)t.processNotification(e);
    }
}
class kk {
    constructor(e, t){
        this.view = e, this.allowHTMLContent = t, this.client = this.view.state.facet(gm), this.documentUri = this.view.state.facet(mm), this.languageId = this.view.state.facet(ym), this.documentVersion = 0, this.changesTimeout = 0, this.client.attachPlugin(this), this.initialize({
            documentText: this.view.state.doc.toString()
        });
    }
    update({ docChanged: e }) {
        e && (this.changesTimeout && clearTimeout(this.changesTimeout), this.changesTimeout = self.setTimeout(()=>{
            this.sendChange({
                documentText: this.view.state.doc.toString()
            });
        }, bk));
    }
    destroy() {
        this.client.detachPlugin(this);
    }
    async initialize({ documentText: e }) {
        this.client.initializePromise && await this.client.initializePromise, this.client.textDocumentDidOpen({
            textDocument: {
                uri: this.documentUri,
                languageId: this.languageId,
                text: e,
                version: this.documentVersion
            }
        });
    }
    async sendChange({ documentText: e }) {
        if (this.client.ready) try {
            await this.client.textDocumentDidChange({
                textDocument: {
                    uri: this.documentUri,
                    version: this.documentVersion++
                },
                contentChanges: [
                    {
                        text: e
                    }
                ]
            });
        } catch (t) {
            console.error(t);
        }
    }
    requestDiagnostics(e) {
        this.sendChange({
            documentText: e.state.doc.toString()
        });
    }
    async requestHoverTooltip(e, { line: t, character: n }) {
        if (!this.client.ready || !this.client.capabilities.hoverProvider) return null;
        this.sendChange({
            documentText: e.state.doc.toString()
        });
        const r = await this.client.textDocumentHover({
            textDocument: {
                uri: this.documentUri
            },
            position: {
                line: t,
                character: n
            }
        });
        if (!r) return null;
        const { contents: s, range: o } = r;
        let l = rr(e.state.doc, {
            line: t,
            character: n
        }), a;
        if (o && (l = rr(e.state.doc, o.start), a = rr(e.state.doc, o.end)), l === null) return null;
        const c = document.createElement("div");
        return c.classList.add("documentation"), this.allowHTMLContent ? c.innerHTML = Bs(s) : c.textContent = Bs(s), {
            pos: l,
            end: a,
            create: (h)=>({
                    dom: c
                }),
            above: !0
        };
    }
    async requestCompletion(e, { line: t, character: n }, { triggerKind: r, triggerCharacter: s }) {
        if (!this.client.ready || !this.client.capabilities.completionProvider) return null;
        this.sendChange({
            documentText: e.state.doc.toString()
        });
        const o = await this.client.textDocumentCompletion({
            textDocument: {
                uri: this.documentUri
            },
            position: {
                line: t,
                character: n
            },
            context: {
                triggerKind: r,
                triggerCharacter: s
            }
        });
        if (!o) return null;
        let a = ("items" in o ? o.items : o).map(({ detail: d, label: p, kind: y, textEdit: b, documentation: k, sortText: T, filterText: D })=>{
            var S;
            const x = {
                label: p,
                detail: d,
                apply: (S = b == null ? void 0 : b.newText) !== null && S !== void 0 ? S : p,
                type: y && vk[y].toLowerCase(),
                sortText: T ?? p,
                filterText: D ?? p
            };
            return k && (x.info = Bs(k)), x;
        });
        const [c, h] = Tk(a), u = e.matchBefore(h);
        let { pos: f } = e;
        if (u) {
            f = u.from;
            const d = u.text.toLowerCase();
            /^\w+$/.test(d) && (a = a.filter(({ filterText: p })=>p.toLowerCase().startsWith(d)).sort(({ apply: p }, { apply: y })=>{
                switch(!0){
                    case p.startsWith(u.text) && !y.startsWith(u.text):
                        return -1;
                    case !p.startsWith(u.text) && y.startsWith(u.text):
                        return 1;
                }
                return 0;
            }));
        }
        return {
            from: f,
            options: a
        };
    }
    processNotification(e) {
        try {
            switch(e.method){
                case "textDocument/publishDiagnostics":
                    this.processDiagnostics(e.params);
            }
        } catch (t) {
            console.error(t);
        }
    }
    processDiagnostics(e) {
        if (e.uri !== this.documentUri) return;
        const t = e.diagnostics.map(({ range: n, message: r, severity: s })=>({
                from: rr(this.view.state.doc, n.start),
                to: rr(this.view.state.doc, n.end),
                severity: ({
                    [ti.DiagnosticSeverity.Error]: "error",
                    [ti.DiagnosticSeverity.Warning]: "warning",
                    [ti.DiagnosticSeverity.Information]: "info",
                    [ti.DiagnosticSeverity.Hint]: "info"
                })[s],
                message: r
            })).filter(({ from: n, to: r })=>n !== null && r !== null && n !== void 0 && r !== void 0).sort((n, r)=>{
            switch(!0){
                case n.from < r.from:
                    return -1;
                case n.from > r.from:
                    return 1;
            }
            return 0;
        });
        this.view.dispatch(Iw(this.view.state, t));
    }
}
function Sk(i) {
    const e = i.serverUri;
    return delete i.serverUri, Ck({
        ...i,
        transport: new io.WebSocketTransport(e)
    });
}
function Ck(i) {
    let e = null;
    return [
        gm.of(i.client || new wk({
            ...i,
            autoClose: !0
        })),
        mm.of(i.documentUri),
        ym.of(i.languageId),
        Ie.define((t)=>e = new kk(t, i.allowHTMLContent)),
        Np((t, n)=>{
            var r;
            return (r = e == null ? void 0 : e.requestHoverTooltip(t, ad(t.state.doc, n))) !== null && r !== void 0 ? r : null;
        }),
        Aw({
            override: [
                async (t)=>{
                    var n, r, s;
                    if (e == null) return null;
                    const { state: o, pos: l, explicit: a } = t, c = o.doc.lineAt(l);
                    let h = ti.CompletionTriggerKind.Invoked, u;
                    return !a && !((s = (r = (n = e.client.capabilities) === null || n === void 0 ? void 0 : n.completionProvider) === null || r === void 0 ? void 0 : r.triggerCharacters) === null || s === void 0) && s.includes(c.text[l - c.from - 1]) && (h = ti.CompletionTriggerKind.TriggerCharacter, u = c.text[l - c.from - 1]), h === ti.CompletionTriggerKind.Invoked && !t.matchBefore(/\w+$/) ? null : await e.requestCompletion(t, ad(o.doc, l), {
                        triggerKind: h,
                        triggerCharacter: u
                    });
                }
            ]
        })
    ];
}
function rr(i, e) {
    if (e.line >= i.lines) return;
    const t = i.line(e.line + 1).from + e.character;
    if (!(t > i.length)) return t;
}
function ad(i, e) {
    const t = i.lineAt(e);
    return {
        line: t.number - 1,
        character: e - t.from
    };
}
function Bs(i) {
    return Array.isArray(i) ? i.map((e)=>Bs(e) + `

`).join("") : typeof i == "string" ? i : i.value;
}
function cd(i) {
    let e = "", t = Array.from(i).join("");
    return /\w/.test(t) && (e += "\\w", t = t.replace(/\w/g, "")), `[${e}${t.replace(/[^\w\s]/g, "\\$&")}]`;
}
function Tk(i) {
    const e = new Set, t = new Set;
    for (const { apply: r } of i){
        const [s, ...o] = r;
        e.add(s);
        for (const l of o)t.add(l);
    }
    const n = cd(e) + cd(t) + "*$";
    return [
        new RegExp("^" + n),
        new RegExp(n)
    ];
}
class yo {
    constructor(e, t, n, r, s, o, l, a, c, h = 0, u){
        this.p = e, this.stack = t, this.state = n, this.reducePos = r, this.pos = s, this.score = o, this.buffer = l, this.bufferBase = a, this.curContext = c, this.lookAhead = h, this.parent = u;
    }
    toString() {
        return `[${this.stack.filter((e, t)=>t % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
    }
    static start(e, t, n = 0) {
        let r = e.parser.context;
        return new yo(e, [], t, n, n, 0, [], 0, r ? new hd(r, r.start) : null, 0, null);
    }
    get context() {
        return this.curContext ? this.curContext.context : null;
    }
    pushState(e, t) {
        this.stack.push(this.state, t, this.bufferBase + this.buffer.length), this.state = e;
    }
    reduce(e) {
        var t;
        let n = e >> 19, r = e & 65535, { parser: s } = this.p, o = s.dynamicPrecedence(r);
        if (o && (this.score += o), n == 0) {
            this.pushState(s.getGoto(this.state, r, !0), this.reducePos), r < s.minRepeatTerm && this.storeNode(r, this.reducePos, this.reducePos, 4, !0), this.reduceContext(r, this.reducePos);
            return;
        }
        let l = this.stack.length - (n - 1) * 3 - (e & 262144 ? 6 : 0), a = l ? this.stack[l - 2] : this.p.ranges[0].from, c = this.reducePos - a;
        c >= 2e3 && !(!((t = this.p.parser.nodeSet.types[r]) === null || t === void 0) && t.isAnonymous) && (a == this.p.lastBigReductionStart ? (this.p.bigReductionCount++, this.p.lastBigReductionSize = c) : this.p.lastBigReductionSize < c && (this.p.bigReductionCount = 1, this.p.lastBigReductionStart = a, this.p.lastBigReductionSize = c));
        let h = l ? this.stack[l - 1] : 0, u = this.bufferBase + this.buffer.length - h;
        if (r < s.minRepeatTerm || e & 131072) {
            let f = s.stateFlag(this.state, 1) ? this.pos : this.reducePos;
            this.storeNode(r, a, f, u + 4, !0);
        }
        if (e & 262144) this.state = this.stack[l];
        else {
            let f = this.stack[l - 3];
            this.state = s.getGoto(f, r, !0);
        }
        for(; this.stack.length > l;)this.stack.pop();
        this.reduceContext(r, a);
    }
    storeNode(e, t, n, r = 4, s = !1) {
        if (e == 0 && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) {
            let o = this, l = this.buffer.length;
            if (l == 0 && o.parent && (l = o.bufferBase - o.parent.bufferBase, o = o.parent), l > 0 && o.buffer[l - 4] == 0 && o.buffer[l - 1] > -1) {
                if (t == n) return;
                if (o.buffer[l - 2] >= t) {
                    o.buffer[l - 2] = n;
                    return;
                }
            }
        }
        if (!s || this.pos == n) this.buffer.push(e, t, n, r);
        else {
            let o = this.buffer.length;
            if (o > 0 && this.buffer[o - 4] != 0) for(; o > 0 && this.buffer[o - 2] > n;)this.buffer[o] = this.buffer[o - 4], this.buffer[o + 1] = this.buffer[o - 3], this.buffer[o + 2] = this.buffer[o - 2], this.buffer[o + 3] = this.buffer[o - 1], o -= 4, r > 4 && (r -= 4);
            this.buffer[o] = e, this.buffer[o + 1] = t, this.buffer[o + 2] = n, this.buffer[o + 3] = r;
        }
    }
    shift(e, t, n, r) {
        if (e & 131072) this.pushState(e & 65535, this.pos);
        else if (e & 262144) this.pos = r, this.shiftContext(t, n), t <= this.p.parser.maxNode && this.buffer.push(t, n, r, 4);
        else {
            let s = e, { parser: o } = this.p;
            (r > this.pos || t <= o.maxNode) && (this.pos = r, o.stateFlag(s, 1) || (this.reducePos = r)), this.pushState(s, n), this.shiftContext(t, n), t <= o.maxNode && this.buffer.push(t, n, r, 4);
        }
    }
    apply(e, t, n, r) {
        e & 65536 ? this.reduce(e) : this.shift(e, t, n, r);
    }
    useNode(e, t) {
        let n = this.p.reused.length - 1;
        (n < 0 || this.p.reused[n] != e) && (this.p.reused.push(e), n++);
        let r = this.pos;
        this.reducePos = this.pos = r + e.length, this.pushState(t, r), this.buffer.push(n, r, this.reducePos, -1), this.curContext && this.updateContext(this.curContext.tracker.reuse(this.curContext.context, e, this, this.p.stream.reset(this.pos - e.length)));
    }
    split() {
        let e = this, t = e.buffer.length;
        for(; t > 0 && e.buffer[t - 2] > e.reducePos;)t -= 4;
        let n = e.buffer.slice(t), r = e.bufferBase + t;
        for(; e && r == e.bufferBase;)e = e.parent;
        return new yo(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, n, r, this.curContext, this.lookAhead, e);
    }
    recoverByDelete(e, t) {
        let n = e <= this.p.parser.maxNode;
        n && this.storeNode(e, this.pos, t, 4), this.storeNode(0, this.pos, t, n ? 8 : 4), this.pos = this.reducePos = t, this.score -= 190;
    }
    canShift(e) {
        for(let t = new xk(this);;){
            let n = this.p.parser.stateSlot(t.state, 4) || this.p.parser.hasAction(t.state, e);
            if (n == 0) return !1;
            if (!(n & 65536)) return !0;
            t.reduce(n);
        }
    }
    recoverByInsert(e) {
        if (this.stack.length >= 300) return [];
        let t = this.p.parser.nextStates(this.state);
        if (t.length > 8 || this.stack.length >= 120) {
            let r = [];
            for(let s = 0, o; s < t.length; s += 2)(o = t[s + 1]) != this.state && this.p.parser.hasAction(o, e) && r.push(t[s], o);
            if (this.stack.length < 120) for(let s = 0; r.length < 8 && s < t.length; s += 2){
                let o = t[s + 1];
                r.some((l, a)=>a & 1 && l == o) || r.push(t[s], o);
            }
            t = r;
        }
        let n = [];
        for(let r = 0; r < t.length && n.length < 4; r += 2){
            let s = t[r + 1];
            if (s == this.state) continue;
            let o = this.split();
            o.pushState(s, this.pos), o.storeNode(0, o.pos, o.pos, 4, !0), o.shiftContext(t[r], this.pos), o.reducePos = this.pos, o.score -= 200, n.push(o);
        }
        return n;
    }
    forceReduce() {
        let { parser: e } = this.p, t = e.stateSlot(this.state, 5);
        if (!(t & 65536)) return !1;
        if (!e.validAction(this.state, t)) {
            let n = t >> 19, r = t & 65535, s = this.stack.length - n * 3;
            if (s < 0 || e.getGoto(this.stack[s], r, !1) < 0) {
                let o = this.findForcedReduction();
                if (o == null) return !1;
                t = o;
            }
            this.storeNode(0, this.pos, this.pos, 4, !0), this.score -= 100;
        }
        return this.reducePos = this.pos, this.reduce(t), !0;
    }
    findForcedReduction() {
        let { parser: e } = this.p, t = [], n = (r, s)=>{
            if (!t.includes(r)) return t.push(r), e.allActions(r, (o)=>{
                if (!(o & 393216)) {
                    if (o & 65536) {
                        let l = (o >> 19) - s;
                        if (l > 1) {
                            let a = o & 65535, c = this.stack.length - l * 3;
                            if (c >= 0 && e.getGoto(this.stack[c], a, !1) >= 0) return l << 19 | 65536 | a;
                        }
                    } else {
                        let l = n(o, s + 1);
                        if (l != null) return l;
                    }
                }
            });
        };
        return n(this.state, 0);
    }
    forceAll() {
        for(; !this.p.parser.stateFlag(this.state, 2);)if (!this.forceReduce()) {
            this.storeNode(0, this.pos, this.pos, 4, !0);
            break;
        }
        return this;
    }
    get deadEnd() {
        if (this.stack.length != 3) return !1;
        let { parser: e } = this.p;
        return e.data[e.stateSlot(this.state, 1)] == 65535 && !e.stateSlot(this.state, 4);
    }
    restart() {
        this.storeNode(0, this.pos, this.pos, 4, !0), this.state = this.stack[0], this.stack.length = 0;
    }
    sameState(e) {
        if (this.state != e.state || this.stack.length != e.stack.length) return !1;
        for(let t = 0; t < this.stack.length; t += 3)if (this.stack[t] != e.stack[t]) return !1;
        return !0;
    }
    get parser() {
        return this.p.parser;
    }
    dialectEnabled(e) {
        return this.p.parser.dialect.flags[e];
    }
    shiftContext(e, t) {
        this.curContext && this.updateContext(this.curContext.tracker.shift(this.curContext.context, e, this, this.p.stream.reset(t)));
    }
    reduceContext(e, t) {
        this.curContext && this.updateContext(this.curContext.tracker.reduce(this.curContext.context, e, this, this.p.stream.reset(t)));
    }
    emitContext() {
        let e = this.buffer.length - 1;
        (e < 0 || this.buffer[e] != -3) && this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
    }
    emitLookAhead() {
        let e = this.buffer.length - 1;
        (e < 0 || this.buffer[e] != -4) && this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
    }
    updateContext(e) {
        if (e != this.curContext.context) {
            let t = new hd(this.curContext.tracker, e);
            t.hash != this.curContext.hash && this.emitContext(), this.curContext = t;
        }
    }
    setLookAhead(e) {
        e > this.lookAhead && (this.emitLookAhead(), this.lookAhead = e);
    }
    close() {
        this.curContext && this.curContext.tracker.strict && this.emitContext(), this.lookAhead > 0 && this.emitLookAhead();
    }
}
class hd {
    constructor(e, t){
        this.tracker = e, this.context = t, this.hash = e.strict ? e.hash(t) : 0;
    }
}
class xk {
    constructor(e){
        this.start = e, this.state = e.state, this.stack = e.stack, this.base = this.stack.length;
    }
    reduce(e) {
        let t = e & 65535, n = e >> 19;
        n == 0 ? (this.stack == this.start.stack && (this.stack = this.stack.slice()), this.stack.push(this.state, 0, 0), this.base += 3) : this.base -= (n - 1) * 3;
        let r = this.start.p.parser.getGoto(this.stack[this.base - 3], t, !0);
        this.state = r;
    }
}
class bo {
    constructor(e, t, n){
        this.stack = e, this.pos = t, this.index = n, this.buffer = e.buffer, this.index == 0 && this.maybeNext();
    }
    static create(e, t = e.bufferBase + e.buffer.length) {
        return new bo(e, t, t - e.bufferBase);
    }
    maybeNext() {
        let e = this.stack.parent;
        e != null && (this.index = this.stack.bufferBase - e.bufferBase, this.stack = e, this.buffer = e.buffer);
    }
    get id() {
        return this.buffer[this.index - 4];
    }
    get start() {
        return this.buffer[this.index - 3];
    }
    get end() {
        return this.buffer[this.index - 2];
    }
    get size() {
        return this.buffer[this.index - 1];
    }
    next() {
        this.index -= 4, this.pos -= 4, this.index == 0 && this.maybeNext();
    }
    fork() {
        return new bo(this.stack, this.pos, this.index);
    }
}
function xs(i, e = Uint16Array) {
    if (typeof i != "string") return i;
    let t = null;
    for(let n = 0, r = 0; n < i.length;){
        let s = 0;
        for(;;){
            let o = i.charCodeAt(n++), l = !1;
            if (o == 126) {
                s = 65535;
                break;
            }
            o >= 92 && o--, o >= 34 && o--;
            let a = o - 32;
            if (a >= 46 && (a -= 46, l = !0), s += a, l) break;
            s *= 46;
        }
        t ? t[r++] = s : t = new e(s);
    }
    return t;
}
class Is {
    constructor(){
        this.start = -1, this.value = -1, this.end = -1, this.extended = -1, this.lookAhead = 0, this.mask = 0, this.context = 0;
    }
}
const ud = new Is;
class Rk {
    constructor(e, t){
        this.input = e, this.ranges = t, this.chunk = "", this.chunkOff = 0, this.chunk2 = "", this.chunk2Pos = 0, this.next = -1, this.token = ud, this.rangeIndex = 0, this.pos = this.chunkPos = t[0].from, this.range = t[0], this.end = t[t.length - 1].to, this.readNext();
    }
    resolveOffset(e, t) {
        let n = this.range, r = this.rangeIndex, s = this.pos + e;
        for(; s < n.from;){
            if (!r) return null;
            let o = this.ranges[--r];
            s -= n.from - o.to, n = o;
        }
        for(; t < 0 ? s > n.to : s >= n.to;){
            if (r == this.ranges.length - 1) return null;
            let o = this.ranges[++r];
            s += o.from - n.to, n = o;
        }
        return s;
    }
    clipPos(e) {
        if (e >= this.range.from && e < this.range.to) return e;
        for (let t of this.ranges)if (t.to > e) return Math.max(e, t.from);
        return this.end;
    }
    peek(e) {
        let t = this.chunkOff + e, n, r;
        if (t >= 0 && t < this.chunk.length) n = this.pos + e, r = this.chunk.charCodeAt(t);
        else {
            let s = this.resolveOffset(e, 1);
            if (s == null) return -1;
            if (n = s, n >= this.chunk2Pos && n < this.chunk2Pos + this.chunk2.length) r = this.chunk2.charCodeAt(n - this.chunk2Pos);
            else {
                let o = this.rangeIndex, l = this.range;
                for(; l.to <= n;)l = this.ranges[++o];
                this.chunk2 = this.input.chunk(this.chunk2Pos = n), n + this.chunk2.length > l.to && (this.chunk2 = this.chunk2.slice(0, l.to - n)), r = this.chunk2.charCodeAt(0);
            }
        }
        return n >= this.token.lookAhead && (this.token.lookAhead = n + 1), r;
    }
    acceptToken(e, t = 0) {
        let n = t ? this.resolveOffset(t, -1) : this.pos;
        if (n == null || n < this.token.start) throw new RangeError("Token end out of bounds");
        this.token.value = e, this.token.end = n;
    }
    getChunk() {
        if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
            let { chunk: e, chunkPos: t } = this;
            this.chunk = this.chunk2, this.chunkPos = this.chunk2Pos, this.chunk2 = e, this.chunk2Pos = t, this.chunkOff = this.pos - this.chunkPos;
        } else {
            this.chunk2 = this.chunk, this.chunk2Pos = this.chunkPos;
            let e = this.input.chunk(this.pos), t = this.pos + e.length;
            this.chunk = t > this.range.to ? e.slice(0, this.range.to - this.pos) : e, this.chunkPos = this.pos, this.chunkOff = 0;
        }
    }
    readNext() {
        return this.chunkOff >= this.chunk.length && (this.getChunk(), this.chunkOff == this.chunk.length) ? this.next = -1 : this.next = this.chunk.charCodeAt(this.chunkOff);
    }
    advance(e = 1) {
        for(this.chunkOff += e; this.pos + e >= this.range.to;){
            if (this.rangeIndex == this.ranges.length - 1) return this.setDone();
            e -= this.range.to - this.pos, this.range = this.ranges[++this.rangeIndex], this.pos = this.range.from;
        }
        return this.pos += e, this.pos >= this.token.lookAhead && (this.token.lookAhead = this.pos + 1), this.readNext();
    }
    setDone() {
        return this.pos = this.chunkPos = this.end, this.range = this.ranges[this.rangeIndex = this.ranges.length - 1], this.chunk = "", this.next = -1;
    }
    reset(e, t) {
        if (t ? (this.token = t, t.start = e, t.lookAhead = e + 1, t.value = t.extended = -1) : this.token = ud, this.pos != e) {
            if (this.pos = e, e == this.end) return this.setDone(), this;
            for(; e < this.range.from;)this.range = this.ranges[--this.rangeIndex];
            for(; e >= this.range.to;)this.range = this.ranges[++this.rangeIndex];
            e >= this.chunkPos && e < this.chunkPos + this.chunk.length ? this.chunkOff = e - this.chunkPos : (this.chunk = "", this.chunkOff = 0), this.readNext();
        }
        return this;
    }
    read(e, t) {
        if (e >= this.chunkPos && t <= this.chunkPos + this.chunk.length) return this.chunk.slice(e - this.chunkPos, t - this.chunkPos);
        if (e >= this.chunk2Pos && t <= this.chunk2Pos + this.chunk2.length) return this.chunk2.slice(e - this.chunk2Pos, t - this.chunk2Pos);
        if (e >= this.range.from && t <= this.range.to) return this.input.read(e, t);
        let n = "";
        for (let r of this.ranges){
            if (r.from >= t) break;
            r.to > e && (n += this.input.read(Math.max(r.from, e), Math.min(r.to, t)));
        }
        return n;
    }
}
class pn {
    constructor(e, t){
        this.data = e, this.id = t;
    }
    token(e, t) {
        let { parser: n } = t.p;
        Ok(this.data, e, t, this.id, n.data, n.tokenPrecTable);
    }
}
pn.prototype.contextual = pn.prototype.fallback = pn.prototype.extend = !1;
pn.prototype.fallback = pn.prototype.extend = !1;
function Ok(i, e, t, n, r, s) {
    let o = 0, l = 1 << n, { dialect: a } = t.p.parser;
    e: for(; l & i[o];){
        let c = i[o + 1];
        for(let d = o + 3; d < c; d += 2)if ((i[d + 1] & l) > 0) {
            let p = i[d];
            if (a.allows(p) && (e.token.value == -1 || e.token.value == p || Dk(p, e.token.value, r, s))) {
                e.acceptToken(p);
                break;
            }
        }
        let h = e.next, u = 0, f = i[o + 2];
        if (e.next < 0 && f > u && i[c + f * 3 - 3] == 65535 && i[c + f * 3 - 3] == 65535) {
            o = i[c + f * 3 - 1];
            continue e;
        }
        for(; u < f;){
            let d = u + f >> 1, p = c + d + (d << 1), y = i[p], b = i[p + 1] || 65536;
            if (h < y) f = d;
            else if (h >= b) u = d + 1;
            else {
                o = i[p + 2], e.advance();
                continue e;
            }
        }
        break;
    }
}
function fd(i, e, t) {
    for(let n = e, r; (r = i[n]) != 65535; n++)if (r == t) return n - e;
    return -1;
}
function Dk(i, e, t, n) {
    let r = fd(t, n, e);
    return r < 0 || fd(t, n, i) < r;
}
const it = typeof process < "u" && process.env && /\bparse\b/.test({}.LOG);
let dl = null;
function dd(i, e, t) {
    let n = i.cursor(Ae.IncludeAnonymous);
    for(n.moveTo(e);;)if (!(t < 0 ? n.childBefore(e) : n.childAfter(e))) for(;;){
        if ((t < 0 ? n.to < e : n.from > e) && !n.type.isError) return t < 0 ? Math.max(0, Math.min(n.to - 1, e - 25)) : Math.min(i.length, Math.max(n.from + 1, e + 25));
        if (t < 0 ? n.prevSibling() : n.nextSibling()) break;
        if (!n.parent()) return t < 0 ? 0 : i.length;
    }
}
class Pk {
    constructor(e, t){
        this.fragments = e, this.nodeSet = t, this.i = 0, this.fragment = null, this.safeFrom = -1, this.safeTo = -1, this.trees = [], this.start = [], this.index = [], this.nextFragment();
    }
    nextFragment() {
        let e = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
        if (e) {
            for(this.safeFrom = e.openStart ? dd(e.tree, e.from + e.offset, 1) - e.offset : e.from, this.safeTo = e.openEnd ? dd(e.tree, e.to + e.offset, -1) - e.offset : e.to; this.trees.length;)this.trees.pop(), this.start.pop(), this.index.pop();
            this.trees.push(e.tree), this.start.push(-e.offset), this.index.push(0), this.nextStart = this.safeFrom;
        } else this.nextStart = 1e9;
    }
    nodeAt(e) {
        if (e < this.nextStart) return null;
        for(; this.fragment && this.safeTo <= e;)this.nextFragment();
        if (!this.fragment) return null;
        for(;;){
            let t = this.trees.length - 1;
            if (t < 0) return this.nextFragment(), null;
            let n = this.trees[t], r = this.index[t];
            if (r == n.children.length) {
                this.trees.pop(), this.start.pop(), this.index.pop();
                continue;
            }
            let s = n.children[r], o = this.start[t] + n.positions[r];
            if (o > e) return this.nextStart = o, null;
            if (s instanceof Te) {
                if (o == e) {
                    if (o < this.safeFrom) return null;
                    let l = o + s.length;
                    if (l <= this.safeTo) {
                        let a = s.prop(Q.lookAhead);
                        if (!a || l + a < this.fragment.to) return s;
                    }
                }
                this.index[t]++, o + s.length >= Math.max(this.safeFrom, e) && (this.trees.push(s), this.start.push(o), this.index.push(0));
            } else this.index[t]++, this.nextStart = o + s.length;
        }
    }
}
class Mk {
    constructor(e, t){
        this.stream = t, this.tokens = [], this.mainToken = null, this.actions = [], this.tokens = e.tokenizers.map((n)=>new Is);
    }
    getActions(e) {
        let t = 0, n = null, { parser: r } = e.p, { tokenizers: s } = r, o = r.stateSlot(e.state, 3), l = e.curContext ? e.curContext.hash : 0, a = 0;
        for(let c = 0; c < s.length; c++){
            if (!(1 << c & o)) continue;
            let h = s[c], u = this.tokens[c];
            if (!(n && !h.fallback) && ((h.contextual || u.start != e.pos || u.mask != o || u.context != l) && (this.updateCachedToken(u, h, e), u.mask = o, u.context = l), u.lookAhead > u.end + 25 && (a = Math.max(u.lookAhead, a)), u.value != 0)) {
                let f = t;
                if (u.extended > -1 && (t = this.addActions(e, u.extended, u.end, t)), t = this.addActions(e, u.value, u.end, t), !h.extend && (n = u, t > f)) break;
            }
        }
        for(; this.actions.length > t;)this.actions.pop();
        return a && e.setLookAhead(a), !n && e.pos == this.stream.end && (n = new Is, n.value = e.p.parser.eofTerm, n.start = n.end = e.pos, t = this.addActions(e, n.value, n.end, t)), this.mainToken = n, this.actions;
    }
    getMainToken(e) {
        if (this.mainToken) return this.mainToken;
        let t = new Is, { pos: n, p: r } = e;
        return t.start = n, t.end = Math.min(n + 1, r.stream.end), t.value = n == r.stream.end ? r.parser.eofTerm : 0, t;
    }
    updateCachedToken(e, t, n) {
        let r = this.stream.clipPos(n.pos);
        if (t.token(this.stream.reset(r, e), n), e.value > -1) {
            let { parser: s } = n.p;
            for(let o = 0; o < s.specialized.length; o++)if (s.specialized[o] == e.value) {
                let l = s.specializers[o](this.stream.read(e.start, e.end), n);
                if (l >= 0 && n.p.parser.dialect.allows(l >> 1)) {
                    l & 1 ? e.extended = l >> 1 : e.value = l >> 1;
                    break;
                }
            }
        } else e.value = 0, e.end = this.stream.clipPos(r + 1);
    }
    putAction(e, t, n, r) {
        for(let s = 0; s < r; s += 3)if (this.actions[s] == e) return r;
        return this.actions[r++] = e, this.actions[r++] = t, this.actions[r++] = n, r;
    }
    addActions(e, t, n, r) {
        let { state: s } = e, { parser: o } = e.p, { data: l } = o;
        for(let a = 0; a < 2; a++)for(let c = o.stateSlot(s, a ? 2 : 1);; c += 3){
            if (l[c] == 65535) {
                if (l[c + 1] == 1) c = Zt(l, c + 2);
                else {
                    r == 0 && l[c + 1] == 2 && (r = this.putAction(Zt(l, c + 2), t, n, r));
                    break;
                }
            }
            l[c] == t && (r = this.putAction(Zt(l, c + 1), t, n, r));
        }
        return r;
    }
}
class Ak {
    constructor(e, t, n, r){
        this.parser = e, this.input = t, this.ranges = r, this.recovering = 0, this.nextStackID = 9812, this.minStackPos = 0, this.reused = [], this.stoppedAt = null, this.lastBigReductionStart = -1, this.lastBigReductionSize = 0, this.bigReductionCount = 0, this.stream = new Rk(t, r), this.tokens = new Mk(e, this.stream), this.topTerm = e.top[1];
        let { from: s } = r[0];
        this.stacks = [
            yo.start(this, e.top[0], s)
        ], this.fragments = n.length && this.stream.end - s > e.bufferLength * 4 ? new Pk(n, e.nodeSet) : null;
    }
    get parsedPos() {
        return this.minStackPos;
    }
    advance() {
        let e = this.stacks, t = this.minStackPos, n = this.stacks = [], r, s;
        if (this.bigReductionCount > 300 && e.length == 1) {
            let [o] = e;
            for(; o.forceReduce() && o.stack.length && o.stack[o.stack.length - 2] >= this.lastBigReductionStart;);
            this.bigReductionCount = this.lastBigReductionSize = 0;
        }
        for(let o = 0; o < e.length; o++){
            let l = e[o];
            for(;;){
                if (this.tokens.mainToken = null, l.pos > t) n.push(l);
                else {
                    if (this.advanceStack(l, n, e)) continue;
                    {
                        r || (r = [], s = []), r.push(l);
                        let a = this.tokens.getMainToken(l);
                        s.push(a.value, a.end);
                    }
                }
                break;
            }
        }
        if (!n.length) {
            let o = r && Ek(r);
            if (o) return it && console.log("Finish with " + this.stackID(o)), this.stackToTree(o);
            if (this.parser.strict) throw it && r && console.log("Stuck with token " + (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : "none")), new SyntaxError("No parse at " + t);
            this.recovering || (this.recovering = 5);
        }
        if (this.recovering && r) {
            let o = this.stoppedAt != null && r[0].pos > this.stoppedAt ? r[0] : this.runRecovery(r, s, n);
            if (o) return it && console.log("Force-finish " + this.stackID(o)), this.stackToTree(o.forceAll());
        }
        if (this.recovering) {
            let o = this.recovering == 1 ? 1 : this.recovering * 3;
            if (n.length > o) for(n.sort((l, a)=>a.score - l.score); n.length > o;)n.pop();
            n.some((l)=>l.reducePos > t) && this.recovering--;
        } else if (n.length > 1) {
            e: for(let o = 0; o < n.length - 1; o++){
                let l = n[o];
                for(let a = o + 1; a < n.length; a++){
                    let c = n[a];
                    if (l.sameState(c) || l.buffer.length > 500 && c.buffer.length > 500) {
                        if ((l.score - c.score || l.buffer.length - c.buffer.length) > 0) n.splice(a--, 1);
                        else {
                            n.splice(o--, 1);
                            continue e;
                        }
                    }
                }
            }
            n.length > 12 && n.splice(12, n.length - 12);
        }
        this.minStackPos = n[0].pos;
        for(let o = 1; o < n.length; o++)n[o].pos < this.minStackPos && (this.minStackPos = n[o].pos);
        return null;
    }
    stopAt(e) {
        if (this.stoppedAt != null && this.stoppedAt < e) throw new RangeError("Can't move stoppedAt forward");
        this.stoppedAt = e;
    }
    advanceStack(e, t, n) {
        let r = e.pos, { parser: s } = this, o = it ? this.stackID(e) + " -> " : "";
        if (this.stoppedAt != null && r > this.stoppedAt) return e.forceReduce() ? e : null;
        if (this.fragments) {
            let c = e.curContext && e.curContext.tracker.strict, h = c ? e.curContext.hash : 0;
            for(let u = this.fragments.nodeAt(r); u;){
                let f = this.parser.nodeSet.types[u.type.id] == u.type ? s.getGoto(e.state, u.type.id) : -1;
                if (f > -1 && u.length && (!c || (u.prop(Q.contextHash) || 0) == h)) return e.useNode(u, f), it && console.log(o + this.stackID(e) + ` (via reuse of ${s.getName(u.type.id)})`), !0;
                if (!(u instanceof Te) || u.children.length == 0 || u.positions[0] > 0) break;
                let d = u.children[0];
                if (d instanceof Te && u.positions[0] == 0) u = d;
                else break;
            }
        }
        let l = s.stateSlot(e.state, 4);
        if (l > 0) return e.reduce(l), it && console.log(o + this.stackID(e) + ` (via always-reduce ${s.getName(l & 65535)})`), !0;
        if (e.stack.length >= 9e3) for(; e.stack.length > 6e3 && e.forceReduce(););
        let a = this.tokens.getActions(e);
        for(let c = 0; c < a.length;){
            let h = a[c++], u = a[c++], f = a[c++], d = c == a.length || !n, p = d ? e : e.split(), y = this.tokens.mainToken;
            if (p.apply(h, u, y ? y.start : p.pos, f), it && console.log(o + this.stackID(p) + ` (via ${h & 65536 ? `reduce of ${s.getName(h & 65535)}` : "shift"} for ${s.getName(u)} @ ${r}${p == e ? "" : ", split"})`), d) return !0;
            p.pos > r ? t.push(p) : n.push(p);
        }
        return !1;
    }
    advanceFully(e, t) {
        let n = e.pos;
        for(;;){
            if (!this.advanceStack(e, null, null)) return !1;
            if (e.pos > n) return pd(e, t), !0;
        }
    }
    runRecovery(e, t, n) {
        let r = null, s = !1;
        for(let o = 0; o < e.length; o++){
            let l = e[o], a = t[o << 1], c = t[(o << 1) + 1], h = it ? this.stackID(l) + " -> " : "";
            if (l.deadEnd && (s || (s = !0, l.restart(), it && console.log(h + this.stackID(l) + " (restarted)"), this.advanceFully(l, n)))) continue;
            let u = l.split(), f = h;
            for(let d = 0; u.forceReduce() && d < 10 && (it && console.log(f + this.stackID(u) + " (via force-reduce)"), !this.advanceFully(u, n)); d++)it && (f = this.stackID(u) + " -> ");
            for (let d of l.recoverByInsert(a))it && console.log(h + this.stackID(d) + " (via recover-insert)"), this.advanceFully(d, n);
            this.stream.end > l.pos ? (c == l.pos && (c++, a = 0), l.recoverByDelete(a, c), it && console.log(h + this.stackID(l) + ` (via recover-delete ${this.parser.getName(a)})`), pd(l, n)) : (!r || r.score < l.score) && (r = l);
        }
        return r;
    }
    stackToTree(e) {
        return e.close(), Te.build({
            buffer: bo.create(e),
            nodeSet: this.parser.nodeSet,
            topID: this.topTerm,
            maxBufferLength: this.parser.bufferLength,
            reused: this.reused,
            start: this.ranges[0].from,
            length: e.pos - this.ranges[0].from,
            minRepeatType: this.parser.minRepeatTerm
        });
    }
    stackID(e) {
        let t = (dl || (dl = new WeakMap)).get(e);
        return t || dl.set(e, t = String.fromCodePoint(this.nextStackID++)), t + e;
    }
}
function pd(i, e) {
    for(let t = 0; t < e.length; t++){
        let n = e[t];
        if (n.pos == i.pos && n.sameState(i)) {
            e[t].score < i.score && (e[t] = i);
            return;
        }
    }
    e.push(i);
}
class _k {
    constructor(e, t, n){
        this.source = e, this.flags = t, this.disabled = n;
    }
    allows(e) {
        return !this.disabled || this.disabled[e] == 0;
    }
}
class vo extends Hp {
    constructor(e){
        if (super(), this.wrappers = [], e.version != 14) throw new RangeError(`Parser version (${e.version}) doesn't match runtime version (14)`);
        let t = e.nodeNames.split(" ");
        this.minRepeatTerm = t.length;
        for(let l = 0; l < e.repeatNodeCount; l++)t.push("");
        let n = Object.keys(e.topRules).map((l)=>e.topRules[l][1]), r = [];
        for(let l = 0; l < t.length; l++)r.push([]);
        function s(l, a, c) {
            r[l].push([
                a,
                a.deserialize(String(c))
            ]);
        }
        if (e.nodeProps) for (let l of e.nodeProps){
            let a = l[0];
            typeof a == "string" && (a = Q[a]);
            for(let c = 1; c < l.length;){
                let h = l[c++];
                if (h >= 0) s(h, a, l[c++]);
                else {
                    let u = l[c + -h];
                    for(let f = -h; f > 0; f--)s(l[c++], a, u);
                    c++;
                }
            }
        }
        this.nodeSet = new wc(t.map((l, a)=>et.define({
                name: a >= this.minRepeatTerm ? void 0 : l,
                id: a,
                props: r[a],
                top: n.indexOf(a) > -1,
                error: a == 0,
                skipped: e.skippedNodes && e.skippedNodes.indexOf(a) > -1
            }))), e.propSources && (this.nodeSet = this.nodeSet.extend(...e.propSources)), this.strict = !1, this.bufferLength = Ip;
        let o = xs(e.tokenData);
        this.context = e.context, this.specializerSpecs = e.specialized || [], this.specialized = new Uint16Array(this.specializerSpecs.length);
        for(let l = 0; l < this.specializerSpecs.length; l++)this.specialized[l] = this.specializerSpecs[l].term;
        this.specializers = this.specializerSpecs.map(gd), this.states = xs(e.states, Uint32Array), this.data = xs(e.stateData), this.goto = xs(e.goto), this.maxTerm = e.maxTerm, this.tokenizers = e.tokenizers.map((l)=>typeof l == "number" ? new pn(o, l) : l), this.topRules = e.topRules, this.dialects = e.dialects || {}, this.dynamicPrecedences = e.dynamicPrecedences || null, this.tokenPrecTable = e.tokenPrec, this.termNames = e.termNames || null, this.maxNode = this.nodeSet.types.length - 1, this.dialect = this.parseDialect(), this.top = this.topRules[Object.keys(this.topRules)[0]];
    }
    createParse(e, t, n) {
        let r = new Ak(this, e, t, n);
        for (let s of this.wrappers)r = s(r, e, t, n);
        return r;
    }
    getGoto(e, t, n = !1) {
        let r = this.goto;
        if (t >= r[0]) return -1;
        for(let s = r[t + 1];;){
            let o = r[s++], l = o & 1, a = r[s++];
            if (l && n) return a;
            for(let c = s + (o >> 1); s < c; s++)if (r[s] == e) return a;
            if (l) return -1;
        }
    }
    hasAction(e, t) {
        let n = this.data;
        for(let r = 0; r < 2; r++)for(let s = this.stateSlot(e, r ? 2 : 1), o;; s += 3){
            if ((o = n[s]) == 65535) {
                if (n[s + 1] == 1) o = n[s = Zt(n, s + 2)];
                else {
                    if (n[s + 1] == 2) return Zt(n, s + 2);
                    break;
                }
            }
            if (o == t || o == 0) return Zt(n, s + 1);
        }
        return 0;
    }
    stateSlot(e, t) {
        return this.states[e * 6 + t];
    }
    stateFlag(e, t) {
        return (this.stateSlot(e, 0) & t) > 0;
    }
    validAction(e, t) {
        return !!this.allActions(e, (n)=>n == t ? !0 : null);
    }
    allActions(e, t) {
        let n = this.stateSlot(e, 4), r = n ? t(n) : void 0;
        for(let s = this.stateSlot(e, 1); r == null; s += 3){
            if (this.data[s] == 65535) {
                if (this.data[s + 1] == 1) s = Zt(this.data, s + 2);
                else break;
            }
            r = t(Zt(this.data, s + 1));
        }
        return r;
    }
    nextStates(e) {
        let t = [];
        for(let n = this.stateSlot(e, 1);; n += 3){
            if (this.data[n] == 65535) {
                if (this.data[n + 1] == 1) n = Zt(this.data, n + 2);
                else break;
            }
            if (!(this.data[n + 2] & 1)) {
                let r = this.data[n + 1];
                t.some((s, o)=>o & 1 && s == r) || t.push(this.data[n], r);
            }
        }
        return t;
    }
    configure(e) {
        let t = Object.assign(Object.create(vo.prototype), this);
        if (e.props && (t.nodeSet = this.nodeSet.extend(...e.props)), e.top) {
            let n = this.topRules[e.top];
            if (!n) throw new RangeError(`Invalid top rule name ${e.top}`);
            t.top = n;
        }
        return e.tokenizers && (t.tokenizers = this.tokenizers.map((n)=>{
            let r = e.tokenizers.find((s)=>s.from == n);
            return r ? r.to : n;
        })), e.specializers && (t.specializers = this.specializers.slice(), t.specializerSpecs = this.specializerSpecs.map((n, r)=>{
            let s = e.specializers.find((l)=>l.from == n.external);
            if (!s) return n;
            let o = Object.assign(Object.assign({}, n), {
                external: s.to
            });
            return t.specializers[r] = gd(o), o;
        })), e.contextTracker && (t.context = e.contextTracker), e.dialect && (t.dialect = this.parseDialect(e.dialect)), e.strict != null && (t.strict = e.strict), e.wrap && (t.wrappers = t.wrappers.concat(e.wrap)), e.bufferLength != null && (t.bufferLength = e.bufferLength), t;
    }
    hasWrappers() {
        return this.wrappers.length > 0;
    }
    getName(e) {
        return this.termNames ? this.termNames[e] : String(e <= this.maxNode && this.nodeSet.types[e].name || e);
    }
    get eofTerm() {
        return this.maxNode + 1;
    }
    get topNode() {
        return this.nodeSet.types[this.top[1]];
    }
    dynamicPrecedence(e) {
        let t = this.dynamicPrecedences;
        return t == null ? 0 : t[e] || 0;
    }
    parseDialect(e) {
        let t = Object.keys(this.dialects), n = t.map(()=>!1);
        if (e) for (let s of e.split(" ")){
            let o = t.indexOf(s);
            o >= 0 && (n[o] = !0);
        }
        let r = null;
        for(let s = 0; s < t.length; s++)if (!n[s]) for(let o = this.dialects[t[s]], l; (l = this.data[o++]) != 65535;)(r || (r = new Uint8Array(this.maxTerm + 1)))[l] = 1;
        return new _k(e, n, r);
    }
    static deserialize(e) {
        return new vo(e);
    }
}
function Zt(i, e) {
    return i[e] | i[e + 1] << 16;
}
function Ek(i) {
    let e = null;
    for (let t of i){
        let n = t.p.stoppedAt;
        (t.pos == t.p.stream.end || n != null && t.pos > n) && t.p.parser.stateFlag(t.state, 2) && (!e || e.score < t.score) && (e = t);
    }
    return e;
}
function gd(i) {
    if (i.external) {
        let e = i.extend ? 1 : 0;
        return (t, n)=>i.external(t, n) << 1 | e;
    }
    return i.get;
}
const Nk = {
    __proto__: null,
    Lemma: 44,
    Exercise: 46,
    Qed: 48,
    forall: 52,
    exists: 54,
    pouet: 56,
    Prop: 58,
    Set: 60,
    exact: 64,
    let: 66
}, Lk = vo.deserialize({
    version: 14,
    states: "&xQYQPOOOOQO'#Ca'#CaOeQPO'#C`OmQPO'#C_OOQO'#Ck'#CkQYQPOOO!OQPO,58zO!^QPO,58zO!cQPO,58yOOQO'#Ci'#CiO!nQPO'#ChOOQO'#Cl'#ClO!vQPO,58yOOQO-E6i-E6iOOQO'#Ce'#CeO#XQPO'#CdOOQO'#Cd'#CdO#dQPO'#CcO#lQPO1G.fO!OQPO1G.fOOQO'#Cj'#CjOOQO1G.e1G.eO#qQPO'#CmO#|QPO,59SOOQO,59S,59SO!cQPO1G.eOOQO-E6j-E6jO$UQPO,58}O!OQPO,58}OOQO7+$Q7+$QO$^QPO7+$QO$cQPO,59XOOQO-E6k-E6kOOQO1G.n1G.nOOQO7+$P7+$PO!OQPO1G.iO$nQPO1G.iOOQO1G.i1G.iOOQO<<Gl<<GlOOQO'#Cg'#CgOOQO1G.s1G.sOOQO7+$T7+$TO$yQPO7+$TO!OQPO<<GoOOQOAN=ZAN=Z",
    stateData: "%O~OdOSPOS~OfPOgPOhPO~OUVOiUO~OfPOgPOhWOpXOqXO~OU`Oj^Ok^Ol^O~OicO~OedOUTXiTX~OUfOehO~OfPOgPOhiOpXOqXO~OUkOYWXeWX~OYlOeVX~OemO~OioOUaXeaX~OUfOeqO~OitOosO~OevO~OUxOmwOnwO~OUzOmwOnwO~Oo{O~O",
    goto: "#YbPPPckqPw!W!_P!fg!l!p!v!|#SSSOTTZR[XRORT[XQORT[QbUQncQulQysR|{ZaUcls{Z_Ucls{QxoRztTYR[QeWRriQTOR]TQ[RRj[QgYRpg",
    nodeNames: "\u26A0 LineComment Source Block Declaration Lemma Identifier Expression Value Keyword Binop Type Action Tactic Final",
    maxTerm: 33,
    skippedNodes: [
        0,
        1
    ],
    repeatNodeCount: 3,
    tokenData: "#h~RZXYtYZt]^tpqt|}!V}!O![!O!P!g!P!Q!l![!]#T!c!}#Y#T#o#Y~ySd~XYtYZt]^tpqt~![Oo~~!_P!`!a!b~!gOY~~!lOe~~!qSP~OY!lZ;'S!l;'S;=`!}<%lO!l~#QP;=`<%l!l~#YOi~~#_RU~!Q![#Y!c!}#Y#T#o#Y",
    tokenizers: [
        0
    ],
    topRules: {
        Source: [
            0,
            2
        ]
    },
    specialized: [
        {
            term: 6,
            get: (i)=>Nk[i] || -1
        }
    ],
    tokenPrec: 0
});
var Bk = new yb(Js.define({
    parser: Lk.configure({
        props: [
            Wp({
                Tactic: P.name,
                Number: P.number,
                Lemma: P.controlKeyword,
                Keyword: P.keyword,
                Type: P.typeName,
                LineComment: P.lineComment
            }),
            Gp.add({
                Block: Db
            })
        ]
    }),
    languageData: {
        commentTokens: {
            line: "/"
        }
    }
})), Ik = eg(Lr.define([
    {
        tag: P.name,
        color: "#B54300"
    },
    {
        tag: P.lineComment,
        color: "#6C6C6C",
        fontStyle: "italic"
    },
    {
        tag: P.controlKeyword,
        color: "#7E00D5",
        fontWeight: "bold"
    },
    {
        tag: P.keyword,
        color: "#008A1C"
    },
    {
        tag: P.typeName,
        color: "#2000FF"
    },
    {
        tag: P.number,
        color: "#00c5d9"
    }
])), qk = Sk({
    serverUri: window.location.href.includes("endiveonline.fr") ? "wss://endiveonline.fr/lsp" : "ws://0.0.0.0:9999",
    rootUri: "file:///",
    workspaceFolders: null,
    documentUri: "file:///coucou",
    languageId: "cpp"
});
const jk = "", Fk = document.querySelector("#editor"), Hk = To.of([
    {
        key: "Tab",
        preventDefault: !0,
        run: iw
    },
    {
        key: "Shift-Tab",
        preventDefault: !0,
        run: _g
    }
]);
globalThis.editor = new $({
    doc: jk,
    extensions: [
        zw,
        Yp(),
        Lb(),
        Iy("Hi ! Start typing, or press Esc if you're lost :)"),
        qk,
        $.lineWrapping,
        Hk,
        Bk,
        Ik
    ],
    parent: Fk
});

//# sourceMappingURL=endive.f69869dc.js.map
