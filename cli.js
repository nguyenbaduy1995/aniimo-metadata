import {AniimoClient} from './client.js';
const [command,value,limit]=process.argv.slice(2);
if(!['user','search'].includes(command)||!value){console.error('Usage: node cli.js user <UID> | node cli.js search <partial-name> [limit=20]');process.exit(1);}
const client=new AniimoClient();
try{await client.connect();const result=command==='user'?await client.getUserInfo(value):await client.searchUsers(value,Number(limit||20));console.log(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2));}catch(e){console.error(e.message);process.exitCode=1;}finally{client.close();}