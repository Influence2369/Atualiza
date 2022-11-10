const express = require('express');
const app = express();
const mysql = require('mysql');
const mysqldump = require('mysqldump');

app.use(express.json());
function conectar(host, user, password, database) {
    const con = mysql.createConnection({
        host: host, // '192.168.0.251', O host do banco. Ex: localhost
        user: user, //'root', Um usuário do banco. Ex: user 
        password: password, //'Ametista@2022',
        database: database //'chatbot_certo' A base de dados a qual a aplicação irá se conectar, deve ser a mesma onde foi executado o Código 1. Ex: node_mysql
    });
    con.connect((err) => {
        if (err) {
            console.log('Erro connecting to database...', err)
            return
        }
    })
    return con
}

app.post('/atualizar', async (req, res) => {
    const con = conectar(req.body.host, req.body.user, req.body.password, req.body.database)
    con.query("SELECT CONF_VERSAO_BASE FROM configuracoes", async (err, versao) => {
        if (err) {
            console.log(err)
            res.send("Impossivel conectar na base de dados informada")
        } else {
            iVersao = versao[0].CONF_VERSAO_BASE
            report = await atualizar(iVersao, con)  
            res.send(report)
        }
    })
})

app.post('/versao', async (req, res) => {
    const con = conectar(req.body.host, req.body.user, req.body.password, req.body.database)
    con.query("SELECT CONF_VERSAO_BASE FROM configuracoes", async (err, versao) => {
        if (err) {
            console.log(err)
            res.send("Impossivel conectar na base de dados informada")
        } else {
            res.send(versao[0].CONF_VERSAO_BASE)
        }
    })
})

app.post('/backup', async (req, res) => {    
    var data = new Date().toLocaleDateString('pt-BR', {timeZone: 'UTC'})
    resultado = await mysqldump({
        connection: {
            host: req.body.host,
            user: req.body.user,
            password: req.body.password,
            database: req.body.database,
        },
        dumpToFile: './'+req.body.database+' - '+data.replaceAll("/","-")+'.sql',
    })
    res.send("Backup gerado e salvo como ./"+req.body.database+" - " + data.replaceAll('/','-') + ".sql")
})

async function atualizar(iVersao, con) {
    return new Promise( async (resolve, reject) => {
        try {


            // Daniel - 31/10/2022 - Primeira versão do atualiza
            if (1 > iVersao) {
                sql = "ALTER TABLE `variavelsistema` "+
                "MODIFY COLUMN `VAR_ULTIMOPEDIDOENVIADO` varchar(50) DEFAULT NULL FIRST, "+
                "ADD COLUMN `VAR_ULTIMOPEDIDOMONTADOENVIADO` varchar(50) DEFAULT '0' AFTER `VAR_ULTIMOPEDIDOENVIADO`;"
                resultado = await executar(con, sql, 1)
                if (resultado !== "OK") {
                    resolve(resultado)
                }
            }


        } catch {
            resolve("ERRO")
        } finally {
            resolve("Banco de dados atualizado")
        }
    })
}

function executar(con, sql, ultVersao) {
    return new Promise( async (resolve, reject) => {
        con.query(sql, (err, x) => {
            if (err) {
                console.log(err)
                resolve('Erro ao executar sql: ' + sql)
            } else {
                con.query('UPDATE configuracoes SET CONF_VERSAO_BASE = ' + ultVersao)
                resolve("OK")
            }
        })
    })
}

app.listen(3474, () => {
    console.log("Servidor iniciado na porta 3474: http://localhost:3474/");
});