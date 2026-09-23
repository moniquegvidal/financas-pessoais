import {Router} from 'express';
import {pool} from '../db.js';
import {auth} from '../middleware/auth.js';
const router=Router();
router.get('/historico',auth,async(req,res)=>{const fim=/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.mes||'')?req.query.mes:new Date().toISOString().slice(0,7);const [y,m]=fim.split('-').map(Number);const meses=[];for(let i=5;i>=0;i--){const d=new Date(y,m-1-i,1);meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)}const out=[];for(const mes of meses){const [[renda],[extras],[despesas]]=await Promise.all([pool.query('SELECT COALESCE(MAX(valor),0) total FROM rendas_mensais WHERE usuario_id=? AND mes=?',[req.user.id,mes]),pool.query("SELECT COALESCE(SUM(valor),0) total FROM receitas WHERE usuario_id=? AND DATE_FORMAT(data,'%Y-%m')=?",[req.user.id,mes]),pool.query("SELECT COALESCE(SUM(valor),0) total FROM despesas WHERE usuario_id=? AND DATE_FORMAT(data,'%Y-%m')=?",[req.user.id,mes])]);const receitas=Number(renda[0].total)+Number(extras[0].total),gastos=Number(despesas[0].total);out.push({mes,receitas,despesas:gastos,saldo:receitas-gastos})}res.json(out)});
export default router;
