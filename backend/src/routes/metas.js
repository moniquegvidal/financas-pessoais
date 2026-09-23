import {Router} from 'express';
import {pool} from '../db.js';
import {auth} from '../middleware/auth.js';
const router=Router();
const validMonth=m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m||'');
router.get('/',auth,async(req,res)=>{const mes=req.query.mes;if(!validMonth(mes))return res.status(400).json({erro:'Mês inválido.'});const [rows]=await pool.query(`SELECT m.categoria_id,c.nome categoria,m.limite FROM metas_categoria m JOIN categorias c ON c.id=m.categoria_id WHERE m.usuario_id=? AND m.mes=? ORDER BY c.id`,[req.user.id,mes]);res.json(rows)});
router.put('/:categoriaId',auth,async(req,res)=>{const mes=req.query.mes,cat=Number(req.params.categoriaId),limite=Number(req.body.limite);if(!validMonth(mes)||!Number.isInteger(cat)||cat<1||!Number.isFinite(limite)||limite<0)return res.status(400).json({erro:'Meta inválida.'});const [c]=await pool.query('SELECT id FROM categorias WHERE id=?',[cat]);if(!c.length)return res.status(400).json({erro:'Categoria inválida.'});if(limite===0){await pool.query('DELETE FROM metas_categoria WHERE usuario_id=? AND mes=? AND categoria_id=?',[req.user.id,mes,cat]);return res.json({removida:true})}await pool.query('INSERT INTO metas_categoria(usuario_id,mes,categoria_id,limite) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE limite=VALUES(limite)',[req.user.id,mes,cat,limite]);res.json({categoria_id:cat,mes,limite})});
export default router;
