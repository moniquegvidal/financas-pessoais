import {Router} from 'express';
import {pool} from '../db.js';
import {auth} from '../middleware/auth.js';
const router=Router();
const validMonth=m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m||'');
router.get('/',auth,async(req,res)=>{
  try{const mes=req.query.mes;if(!validMonth(mes))return res.status(400).json({erro:'Mês inválido.'});
    const [rows]=await pool.query('SELECT valor FROM rendas_mensais WHERE usuario_id=? AND mes=?',[req.user.id,mes]);
    res.json({valor:rows.length?Number(rows[0].valor):0});
  }catch(e){console.error(e);res.status(500).json({erro:'Erro ao consultar a renda.'});}
});
router.put('/',auth,async(req,res)=>{
  try{const mes=req.query.mes;const valor=Number(req.body.valor);if(!validMonth(mes))return res.status(400).json({erro:'Mês inválido.'});if(!Number.isFinite(valor)||valor<0)return res.status(400).json({erro:'Informe uma renda válida.'});
    await pool.query('INSERT INTO rendas_mensais(usuario_id,mes,valor) VALUES(?,?,?) ON DUPLICATE KEY UPDATE valor=?',[req.user.id,mes,valor,valor]);res.json({valor,mes});
  }catch(e){console.error(e);res.status(500).json({erro:'Erro ao salvar a renda.'});}
});
export default router;
