// Real API handlers + graph service, backed by a deterministic transactional Firestore double.
// No production credentials, external writes, or new test dependencies are needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
class MemoryFirestore {
  constructor() { this.records = new Map(); this.version = 0; }
  collection(name) { return new Query(this,name); }
  async runTransaction(callback) {
    for (let attempt=0;attempt<10;attempt++) {
      const version = this.version; const writes=[]; let writing=false;
      const tx = { get: async ref => { assert.equal(writing,false,'Firestore requires all reads before writes'); return ref.get(); }, set:(ref,value)=>{ writing=true; writes.push(()=>this.records.set(ref.key,clone(value))); }, delete:ref=>{writing=true;writes.push(()=>this.records.delete(ref.key));} };
      const result=await callback(tx);
      if(this.version!==version)continue;
      writes.forEach(write=>write());this.version++;return result;
    }
    throw new Error('Transaction contention');
  }
}
class Query {
  constructor(db,name,filters=[],limit=Infinity,sort=null){Object.assign(this,{db,name,filters,max:limit,sort});}
  doc(id){assert.ok(id&&!id.includes('/'));const key=`${this.name}/${id}`;return {id,key,get:async()=>({ id,exists:this.db.records.has(key),data:()=>clone(this.db.records.get(key)) })};}
  where(field,operator,value){return new Query(this.db,this.name,[...this.filters,[field,operator,value]],this.max,this.sort);}
  limit(max){return new Query(this.db,this.name,this.filters,max,this.sort);}
  orderBy(field,direction){return new Query(this.db,this.name,this.filters,this.max,[field,direction]);}
  async get(){
    let docs=[...this.db.records].filter(([key])=>key.startsWith(`${this.name}/`)).map(([key,value])=>({id:key.slice(this.name.length+1),data:()=>clone(value)}));
    docs=docs.filter(doc=>this.filters.every(([field,operator,value])=>operator==='in'?value.includes(doc.data()[field]):doc.data()[field]===value));
    if(this.sort){const [field,direction]=this.sort;docs.sort((a,b)=>String(a.data()[field]).localeCompare(String(b.data()[field]))*(direction==='desc'?-1:1));}
    docs=docs.slice(0,this.max);return {docs,empty:!docs.length,size:docs.length};
  }
}
const db = new MemoryFirestore();
const sessions = { owner:{id:'owner',discordId:'discord-owner',displayName:'Owner',effectivePermissions:[]}, other:{id:'other',discordId:'discord-other',displayName:'Other',effectivePermissions:[]}, moderator:{id:'mod',discordId:'discord-mod',isAdmin:true,effectivePermissions:['wiki.moderate']} };
const originalLoad = Module._load;
Module._load = function(request,parent,isMain) {
  if(request==='server-only')return {};
  if(request==='@/lib/firebase/admin')return {adminDb:db};
  if(request==='@/lib/supabase/admin')return {createAdminClient:()=>null};
  if(request==='@/lib/auth/session')return {getCurrentSession:async token=>sessions[token]||null};
  if(request.startsWith('@/'))request=path.join(root,request.slice(2));
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts'] = function(module,file) { const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});module._compile(output.outputText,file); };
const { NextRequest } = require('next/server');
const entities=require('../app/api/wiki/entities/route.ts');
const entity=require('../app/api/wiki/entities/[id]/route.ts');
const characters=require('../app/api/wiki/characters/route.ts');
const character=require('../app/api/wiki/characters/[slug]/route.ts');
const backlinks=require('../app/api/wiki/characters/[slug]/backlinks/route.ts');
const wanted=require('../app/api/wiki/wanted/route.ts');
const links=require('../app/api/wiki/links/route.ts');
const link=require('../app/api/wiki/links/[id]/route.ts');
const search=require('../app/api/wiki/search/route.ts');
const core=require('../lib/wiki/link-core.ts');
const store=require('../lib/wiki/graph-store.ts');
const req=(url,method='GET',body,token)=>new NextRequest(`http://localhost${url}`,{method,headers:{...(token?{authorization:`Bearer ${token}`} : {}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const params=(key,value)=>({params:Promise.resolve({[key]:value})});
async function json(response,status=200){assert.equal(response.status,status,await response.clone().text());return response.json();}
const marker=(name,type='',id='new-reference')=>`<span data-wiki-link-id="${id}" data-entity-id="" data-entity-type="${type}" data-mention-name="${core.escapeHtml(name)}">${core.escapeHtml(name)}</span>`;
const section=html=>[{section_key:'biography',title:'Biography',content_html:html,sort_order:1}];
async function create(title,type='character',content='',aliases=[]){return json(await entities.POST(req('/api/wiki/entities','POST',{title,entity_type:type,sections:section(content),aliases},'owner')),201);}
async function detail(page,token){return json(await entity.GET(req(`/api/wiki/entities/${page.id}`,'GET',undefined,token),params('id',page.id)));}
async function change(page,body){return json(await entity.PUT(req(`/api/wiki/entities/${page.id}`,'PUT',body,'owner'),params('id',page.id)));}
async function act(id,body,token='owner',status=200){return json(await link.PATCH(req(`/api/wiki/links/${id}`,'PATCH',body,token),params('id',id)),status);}
const test = require('node:test');
test('future character → resolution → backlink removal; real character routes and permanent ID lookup',async()=>{
  const damon=await json(await characters.POST(req('/api/wiki/characters','POST',{full_name:'Damon Lifecycle Vox',sections:section(`<p>Damon eventually worked with ${marker('John Lifecycle Smith','character')} during the heist.</p>`)},'owner')));
  let source=await detail(damon);const ref=source.wiki_links[0];assert.equal(ref.status,'unresolved');assert.equal(ref.target_page_id,null);assert.equal(ref.source_page_id,damon.id);assert.ok(ref.created_at);assert.equal(ref.original_mention_text,'@John Lifecycle Smith');assert.ok(source.sections[0].content_json.wiki_link_ids.includes(ref.id));
  const html=core.renderWikiHtml(source.sections[0].content_html,source.wiki_links);assert.match(html,/decoration-dotted/);assert.match(html,/John Lifecycle Smith/);assert.match(html,/<p>Damon eventually/);
  const missing=await json(await wanted.GET(req('/api/wiki/wanted')));assert.ok(missing.wanted.some(g=>g.name==='John Lifecycle Smith'&&g.page_count===1));
  const john=await create('John Lifecycle Smith');source=await detail(damon);assert.equal(source.wiki_links[0].target_page_id,john.id);assert.equal(source.wiki_links[0].resolution_method,'automatic');assert.match(core.renderWikiHtml(source.sections[0].content_html,source.wiki_links),/\/wiki\/characters\/john-lifecycle-smith/);
  assert.equal((await detail(john)).backlinks[0].source_page_id,damon.id);assert.match((await detail(john)).backlinks[0].context_snippet,/during the heist/);
  assert.equal((await json(await backlinks.GET(req(`/api/wiki/characters/${john.id}/backlinks`),params('slug',john.id)))).backlinks.length,1);
  const audits=await json(await links.GET(req('/api/wiki/links','GET',undefined,'moderator')));assert.ok(audits.audit.some(a=>a.method==='automatic'&&a.resolved_entity_id===john.id));
  // A stale pre-resolution HTML payload must retain the durable graph target.
  await json(await character.PUT(req(`/api/wiki/characters/${damon.slug}`,'PUT',{sections:section(`<p>Damon eventually worked with ${core.mentionMarker({...ref,target_page_id:null})} during the heist.</p>`)},'owner'),params('slug',damon.slug)));
  assert.equal((await detail(damon)).wiki_links[0].target_page_id,john.id);
  await change(damon,{sections:section('<p>Damon worked alone.</p>')});assert.equal((await detail(john)).backlinks.length,0);
});
test('similar and duplicate names stay unresolved; manual changes preserve Johnny and update both backlinks',async()=>{
  await create('John Similar Smith');await create('John Similar Doe');await create('Johnny Similar Smith');
  const short=await create('Short Name Source','character',marker('John','character'));assert.equal((await detail(short)).wiki_links[0].status,'unresolved');
  const first=await create('Ambiguous John Smith');const second=await create('Ambiguous John Smith');
  const source=await create('Ambiguity Source','character',marker('Ambiguous John Smith','character'));
  let ref=(await detail(source)).wiki_links[0];assert.equal(ref.status,'unresolved');
  await act(ref.id,{action:'target',targetId:second.id,displayName:'Johnny'});ref=(await detail(source)).wiki_links[0];assert.equal(ref.target_page_id,second.id);assert.equal(ref.display_name,'Johnny');assert.equal((await detail(first)).backlinks.length,0);assert.equal((await detail(second)).backlinks.length,1);
  await act(ref.id,{action:'target',targetId:first.id});assert.equal((await detail(second)).backlinks.length,0);assert.equal((await detail(first)).backlinks.length,1);assert.equal((await detail(source)).wiki_links[0].display_name,'Johnny');
  await change(first,{title:'Renamed John Voss'});ref=(await detail(source)).wiki_links[0];assert.equal(ref.target_page_id,first.id);assert.equal(ref.display_name,'Johnny');assert.equal(ref.target.title,'Renamed John Voss');
  const alias=await create('Alias Source','character',marker('Ambiguous John Smith','character'));assert.equal((await detail(alias)).wiki_links[0].status,'unresolved','old name still collides with the second entity');
  const manual=await json(await links.GET(req('/api/wiki/links','GET',undefined,'moderator')));assert.ok(manual.audit.some(a=>a.method==='manual'&&a.resolved_by_user_id==='owner'));
  await act(ref.id,{action:'remove'});assert.equal((await detail(first)).backlinks.length,0);assert.match((await detail(source)).sections[0].content_html,/Johnny/);assert.equal((await detail(source)).wiki_links.length,0);
});
test('business, gang, organization and every registered or future type use the same graph',async()=>{
  for(const type of core.WIKI_ENTITY_TYPES.concat(['future_vehicle'])) {
    const title=`Future ${type}`;const source=await create(`Source ${type}`,type,`<p>Working with ${marker(title,type)}.</p>`);
    assert.equal((await detail(source)).wiki_links[0].status,'unresolved');const target=await create(title,type);assert.equal((await detail(source)).wiki_links[0].target_page_id,target.id);assert.equal((await detail(target)).backlinks[0].source.entity_type,type);
    await change(target,{title:`Renamed ${type}`});assert.equal((await detail(source)).wiki_links[0].target_page_id,target.id);
    const aliasSource=await create(`Alias ${type}`,type,marker(title,type));assert.equal((await detail(aliasSource)).wiki_links[0].target_page_id,target.id);
    await change(source,{sections:section('Mention deleted.')});assert.ok(!(await detail(target)).backlinks.some(b=>b.source_page_id===source.id));
  }
});
test('cross-type ambiguity, explicit types, repeated mentions, and absence of factual relationships',async()=>{
  const gang=await create('REDACTED','gang');const business=await create('REDACTED','business');
  const source=await create('Redaction Source','organization',`${marker('REDACTED')} ${marker('REDACTED','gang')} ${marker('REDACTED','gang')}`);
  const data=await detail(source);assert.equal(data.wiki_links[0].status,'unresolved');assert.equal(data.wiki_links[1].target_page_id,gang.id);assert.equal(data.wiki_links[2].target_page_id,gang.id);assert.equal((await detail(business)).backlinks.length,0);assert.equal((await detail(gang)).backlinks.length,2);assert.equal(data.relationships,undefined);
  const result=await json(await search.GET(req('/api/wiki/search?q=REDACTED&type=business')));assert.equal(result.results.length,1);assert.equal(result.results[0].id,business.id);
});
test('owner/editor authorization, draft and hidden-section privacy, broken links, restoration and audit',async()=>{
  const target=await create('Privacy Target','business');const source=await create('Privacy Source','organization',marker('Privacy Target','business'));
  const ref=(await detail(source)).wiki_links[0];await act(ref.id,{action:'target',targetId:target.id},'other',403);await act(ref.id,{action:'target',targetId:target.id},null,401);
  await json(await links.GET(req(`/api/wiki/links?source=${source.id}`,'GET',undefined,'other')),403);
  await json(await links.GET(req('/api/wiki/links','GET',undefined,'owner')),403);
  await change(source,{sections:[{...section(marker('Privacy Target','business'))[0],is_hidden:true}]});assert.equal((await detail(target)).backlinks.length,0);assert.equal((await detail(source)).wiki_links.length,0);
  const privatePage=await create('Draft Target','business');await store.commitWikiPage(db,{...privatePage,is_draft:true},'owner');
  await json(await entity.GET(req(`/api/wiki/entities/${privatePage.id}`),params('id',privatePage.id)),404);
  const future=await create('Draft Reference','character',marker('Draft Target','business'));assert.equal((await detail(future)).wiki_links[0].status,'unresolved');
  await store.commitWikiPage(db,{...privatePage,is_draft:false},'owner');assert.equal((await detail(future)).wiki_links[0].target_page_id,privatePage.id);
  await store.commitWikiPage(db,{...privatePage,status:'archived'},'owner');assert.equal((await detail(future)).wiki_links[0].status,'broken');
  await store.commitWikiPage(db,{...privatePage,status:'active'},'owner');assert.equal((await detail(future)).wiki_links[0].status,'resolved');
  await json(await entity.DELETE(req(`/api/wiki/entities/${privatePage.id}`,'DELETE',undefined,'owner'),params('id',privatePage.id)));assert.equal((await detail(future)).wiki_links[0].status,'broken');assert.equal((await detail(future)).wiki_links[0].target_page_id,privatePage.id);
  const audit=await json(await links.GET(req('/api/wiki/links','GET',undefined,'moderator')));assert.ok(audit.audit.some(a=>a.method==='broken'&&a.resolved_entity_id===privatePage.id));
});
test('legacy non-UUID links are migrated on save, scripts sanitized, forged IDs cannot overwrite another source',async()=>{
  const target=await create('Legacy Target');
  const source=await create('Legacy Source','character',`<p>Hi <span data-character-id="${target.id}" data-character-name="Legacy Target">@Legacy Target</span>.</p><img src="x" onerror="alert(1)"><script>alert(1)</script>`);
  let data=await detail(source);assert.equal(data.wiki_links.length,1);assert.equal(data.wiki_links[0].target_page_id,target.id);assert.doesNotMatch(data.sections[0].content_html,/onerror|<script/);
  const victim=data.wiki_links[0];const attacker=await create('Forged Source','business',marker('Forged Name','business',victim.id));assert.notEqual((await detail(attacker)).wiki_links[0].id,victim.id);assert.equal((await detail(source)).wiki_links[0].display_name,'Legacy Target');
  assert.equal(core.normalizeWikiName("  Damon's   Glizzy's  "),"damon's glizzy's");
  const punctuation=await create("Damon's Glizzy's",'business');const mention=await create('Punctuation Source','gang',marker("Damon's Glizzy's",'business'));assert.equal((await detail(mention)).wiki_links[0].target_page_id,punctuation.id);
});
test('concurrent same-name creation serializes; subsequent untyped references stay unresolved',async()=>{
  const [a,b]=await Promise.all([create('Concurrent Match','gang'),create('Concurrent Match','business')]);assert.notEqual(a.id,b.id);
  const source=await create('Concurrent Source','event',marker('Concurrent Match'));assert.equal((await detail(source)).wiki_links[0].status,'unresolved');
});
test('failed edits roll back page and graph together',async()=>{
  const source=await create('Rollback Source','character',marker('Missing rollback','character'));
  const before=await detail(source);const ref=before.wiki_links[0];await act(ref.id,{action:'target',targetId:'does-not-exist'},'owner',409);const after=await detail(source);assert.deepEqual(after.sections,before.sections);assert.deepEqual(after.wiki_links,before.wiki_links);
});
test('custom future text keeps the original lookup name across repeated saves',async()=>{
  const source=await create('Custom Future Source','character',marker('Future Full John Smith','character'));
  const original=await detail(source);
  await change(source,{sections:original.sections.map(s=>({...s,content_html:s.content_html.replace('>Future Full John Smith</span>','>Johnny</span>')}))});
  await change(source,{sections:(await detail(source)).sections});
  assert.equal((await detail(source)).wiki_links[0].normalized_name,'future full john smith');
  const target=await create('Future Full John Smith');const ref=(await detail(source)).wiki_links[0];assert.equal(ref.target_page_id,target.id);assert.equal(ref.display_name,'Johnny');assert.match((await detail(target)).backlinks[0].context_snippet,/Johnny/);
});
test('explicit legacy backfill is idempotent and accepts old non-UUID entity IDs',async()=>{
  const now=new Date().toISOString();const legacyTarget={id:'char-legacy-2000',slug:'legacy-permanent-target',title:'Legacy Permanent Target',entity_type:'character',status:'active',is_archived:false,page_views:0,summary:'',created_by_discord_id:'discord-owner',created_by_user_id:'owner',created_at:now,updated_at:now,character:{page_id:'char-legacy-2000',full_name:'Legacy Permanent Target',aliases:[],avatar_url:''},sections:section(''),relationships:[],categories:[],gallery:[]};
  db.records.set('wiki_characters/legacy-permanent-target',clone(legacyTarget));
  const legacySource={...legacyTarget,id:'char-legacy-source',slug:'legacy-permanent-source',title:'Legacy Source Only',sections:section('<p>Works with <span data-character-id="char-legacy-2000" data-character-name="Legacy Permanent Target">@Legacy Permanent Target</span>.</p>')};
  db.records.set('wiki_characters/legacy-permanent-source',clone(legacySource));
  assert.equal((await detail(legacyTarget)).backlinks.length,0,'public reads do not scan source HTML');
  await json(await links.POST(req('/api/wiki/links','POST',undefined,'moderator')));
  assert.equal((await detail(legacyTarget)).backlinks.length,1);assert.equal((await detail(legacySource)).wiki_links[0].target_page_id,'char-legacy-2000');
  const id=(await detail(legacySource)).wiki_links[0].id;await json(await links.POST(req('/api/wiki/links','POST',undefined,'moderator')));assert.equal((await detail(legacySource)).wiki_links[0].id,id);assert.equal((await detail(legacyTarget)).backlinks.length,1);
});
