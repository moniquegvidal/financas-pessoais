import {Router} from 'express';
import {pool} from '../db.js';
import {auth} from '../middleware/auth.js';
const router=Router();
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
const validate=({nome, categoria_id, valor, data})=>{
  if(!nome?.trim()||!categoria_id||valor===undefined||valor===null||!data) return 'Preencha todos os campos.';
  if(!Number.isInteger(Number(categoria_id)) || Number(categoria_id) < 1) return 'Categoria inválida.';
  if(!Number.isFinite(Number(valor))||Number(valor)<=0) return 'O valor deve ser maior que zero.';
  if(!validDate(data)) return 'Data inválida.';
};
router.get('/',auth,async(req,res)=>{
  const mes=req.query.mes; if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes||'')) return res.status(400).json({erro:'Mês inválido.'});
  const [rec]=await pool.query('SELECT * FROM despesas_recorrentes WHERE usuario_id=? AND ativa=1 AND DATE_FORMAT(data_inicio,\'%Y-%m\')<=?',[req.user.id,mes]);
  const [yy,mm]=mes.split('-').map(Number);const lastDay=new Date(yy,mm,0).getDate();
  for(const x of rec){const day=Math.min(Number(x.dia),lastDay),data=`${mes}-${String(day).padStart(2,'0')}`;const marker=`[REC:${x.id}]`;
    const [exists]=await pool.query('SELECT id FROM despesas WHERE usuario_id=? AND data=? AND nome LIKE ? LIMIT 1',[req.user.id,data,marker+'%']);
    if(!exists.length)await pool.query('INSERT INTO despesas(usuario_id,categoria_id,nome,valor,data) VALUES(?,?,?,?,?)',[req.user.id,x.categoria_id,marker+' '+x.nome,x.valor,data]);
  }
  const [rows]=await pool.query(`SELECT d.id,CASE WHEN d.nome LIKE '[REC:%]%' THEN TRIM(SUBSTRING(d.nome,LOCATE('] ',d.nome)+2)) ELSE d.nome END nome,d.nome LIKE '[REC:%]%' recorrente,d.valor,d.data,d.data_criacao,c.id categoria_id,c.nome categoria
    FROM despesas d JOIN categorias c ON c.id=d.categoria_id WHERE d.usuario_id=? AND DATE_FORMAT(d.data,'%Y-%m')=? ORDER BY d.data DESC,d.id DESC`,[req.user.id,mes]);
  res.json(rows);
});
router.post('/',auth,async(req,res)=>{
  const erro=validate(req.body); if(erro)return res.status(400).json({erro});
  const {nome,categoria_id,valor,data}=req.body;
  const [r]=await pool.query('INSERT INTO despesas(usuario_id,categoria_id,nome,valor,data) VALUES(?,?,?,?,?)',[req.user.id,Number(categoria_id),nome.trim(),Number(valor),data]);
  const [rows]=await pool.query(`SELECT d.id,d.nome,d.valor,d.data,c.id categoria_id,c.nome categoria FROM despesas d JOIN categorias c ON c.id=d.categoria_id WHERE d.id=? AND d.usuario_id=?`,[r.insertId,req.user.id]);
  res.status(201).json(rows[0]);
});
router.put('/:id',auth,async(req,res)=>{
  const erro=validate(req.body); if(erro)return res.status(400).json({erro});
  const {nome,categoria_id,valor,data}=req.body;
  const [r]=await pool.query('UPDATE despesas SET categoria_id=?,nome=?,valor=?,data=? WHERE id=? AND usuario_id=?',[Number(categoria_id),nome.trim(),Number(valor),data,req.params.id,req.user.id]);
  if(!r.affectedRows)return res.status(404).json({erro:'Despesa não encontrada.'});
  const [rows]=await pool.query(`SELECT d.id,d.nome,d.valor,d.data,c.id categoria_id,c.nome categoria FROM despesas d JOIN categorias c ON c.id=d.categoria_id WHERE d.id=? AND d.usuario_id=?`,[req.params.id,req.user.id]);
  res.json(rows[0]);
});
router.delete('/:id',auth,async(req,res)=>{
  const [r]=await pool.query('DELETE FROM despesas WHERE id=? AND usuario_id=?',[req.params.id,req.user.id]);
  if(!r.affectedRows)return res.status(404).json({erro:'Despesa não encontrada.'});
  res.json({mensagem:'Despesa excluída.'});
});
export default router;
