package sx.callcenter

import groovy.util.logging.Slf4j
import groovy.transform.CompileDynamic
import groovy.transform.ToString

import grails.rest.*
import grails.converters.*
import grails.compiler.GrailsCompileStatic
import grails.gorm.transactions.Transactional
import grails.plugin.springsecurity.annotation.Secured

import org.apache.commons.lang3.exception.ExceptionUtils

import sx.reports.ReportService
import sx.utils.Periodo
import sx.utils.ImporteALetra

import sx.cloud.MailJetService

@Slf4j
@GrailsCompileStatic
// @Secured("IS_AUTHENTICATED_ANONYMOUSLY")
class PedidoController extends RestfulController<Pedido> {
    static responseFormats = ['json']

    ReportService reportService
    PedidoService pedidoService
    MailJetService mailJetService

    PedidoController() {
        super(Pedido)
    }

    /*
    def show() {
        Pedido found = Pedido.get(params.id as String)
        log.info('Found pedido: {}', found.folio)
        return found
    }
    */

    @Override
    @CompileDynamic
    protected List<Pedido> listAllResources(Map params) {
        params.sort = 'lastUpdated'
        params.order = 'desc'
        params.max = 1000
        params.periodo = Periodo.fromNow(30)
        log.info('List: {}', params)
        def periodo = params.periodo
        def query = Pedido.where{fecha >= periodo.fechaInicial  && status == 'COTIZACION'}
        return query.list(params);
    }
    
    @CompileDynamic
    def historico() {
        log.info('Historico: {}', params)
        params.sort = 'lastUpdated'
        params.order = 'desc'
        params.max = 100
        def periodo = Periodo.fromNow(30)
        def query = Pedido.where{fecha >= periodo.fechaInicial  && status != 'COTIZACION'}
        respond query.list(params);
    }

    @CompileDynamic
    def search() {
        log.debug('Search PARAMS: {}', params)
        params.sort = 'lastUpdated'
        params.order = 'desc'
        params.max = 100
        def query = Pedido.where{}
        if(params.tipo == 'FACTURADOS') {
            log.info('FACTURADOS.--.....')
            query = Pedido.where{status == 'FACTURADO_TIMBRADO'}
        } else if (params.tipo == 'CERRADOS') {
            query = Pedido.where{status in ['CERRADO', 'FACTURADO']}
        } 
        Periodo periodo = params.periodo?: Periodo.getCurrentMonth()
        query = query.where{fecha >= periodo.fechaInicial && fecha <= periodo.fechaFinal}
        respond query.list(params);
    }
   
    @CompileDynamic
    @Transactional
    def update() {
        String id = params.id as String
        Pedido pedido = Pedido.get(id)
        def envioOrigen = pedido.envio
        bindData pedido, getObjectToBind()
        if(pedido.envio) {
            if(!pedido.envio.pedido) {
                pedido.envio.pedido = pedido
            }
        }
        pedido = pedidoService.save(pedido)
        if(pedido.envio == null && envioOrigen) {
            envioOrigen.delete flush: true // Hack por que el envio no se elimina de manera automárica.
        }
        respond pedido, view: 'show'
    }

    

    @CompileDynamic
    protected Pedido createResource() {
        Pedido res = new Pedido()
        bindData res, getObjectToBind()
        res.folio = -1L
        res.status = 'COTIZACION'
        if(res.envio) {
            log.info('Envio: {}' , res.envio) // Hack para salvar correctamente el envio *** ???
            res.envio.pedido = res
        }
        return res
    }
   

    @Override
    protected Pedido saveResource(Pedido resource) {
        return pedidoService.save(resource)
    }

    @Override
    protected Pedido updateResource(Pedido resource) {
        return pedidoService.save(resource)
    }

    /**
     * Elimina la requisicion
     *
     * @param resource
     */
    @Override
    protected void deleteResource(Pedido resource) {
        pedidoService.delete(resource)
    }

    def cerrar(Pedido pedido) {
        if(pedido == null) {
            notFound()
            return
        }
        pedido = pedidoService.cerrar(pedido)
        respond pedido
    }

    def autorizar(Pedido pedido) {
        if(pedido == null) {
            notFound()
            return
        }
        String comentario = params.comentario
        String usuario = params.usuario
        pedido = pedidoService.autorizar(pedido, usuario, comentario)
        respond pedido
    }

    def print(Pedido pedido ) {
        if(pedido == null){
            notFound()
            return
        }
        Map repParams = [id: pedido.id]
        repParams.IMP_CON_LETRA = ImporteALetra.aLetra(pedido.total)
        repParams.TELEFONOS = pedido.cliente.getTelefonos()
        def pdf =  reportService.run('CCPedido.jrxml', repParams)
        render (file: pdf.toByteArray(), contentType: 'application/pdf', filename: 'CCPedido.pdf')
    }

    def findByFolio() {
        // log.info('findByFolio {}', params)
        def pedido =  Pedido.where{folio == params.getLong('folio')}.
            where{ formaDePago =~ 'DEPOSITO%' || formaDePago == 'TRANSFERENCIA'}
            .find()

        if(pedido == null){
            notFound()
            return
        }
        respond pedido
    }

    @CompileDynamic
    def enviarFactura(){
        log.info('Enviar factura: {}', params)
        
        def target = params.target
        def factura = params.factura
        def pdfUrl = params.pdfUrl
        def xmlUrl = params.xmlUrl
        def targetName = params.targetName

        def res = mailJetService.enviarCfdi(target, factura, pdfUrl, xmlUrl, targetName)
        if(res.status == 200) {
            respond (status: 200)
            return
        } else {
            respond( [res.data.toString()], status: 500)
        }
        
    }

    @CompileDynamic
    def enviarCotizacion(Pedido pedido ) {

        if(pedido == null){
            notFound()
            return
        }
        Map repParams = [id: pedido.id]
        repParams.IMP_CON_LETRA = ImporteALetra.aLetra(pedido.total)
        repParams.TELEFONOS = pedido.cliente.getTelefonos().toString()

        
        def pdf =  reportService.run('CCPedido.jrxml', repParams)
        
        def encodedData = pdf.toByteArray().encodeBase64().toString()
        String target = params.target

        def res = mailJetService.enviarCotizacion(target, pedido.folio.toString(), encodedData, pedido.nombre)
        
        if(res.status == 200) {
            respond (status: 200)
            return
        } else {
            respond( [res.data.toString()], status: 500)
        }
        
        respond status: 200
    }

     @CompileDynamic
    def buscarSucursal(String codigoPostal) {
        def row = pedidoService.buscarSucursal(codigoPostal)
        respond(['sucursal': row], status: 200)

    }

    def handleException(Exception e) {
        String message = ExceptionUtils.getRootCauseMessage(e)
        // log.error(message, ExceptionUtils.getRootCause(e))
        log.error(message, e)
        respond([message: message], status: 500)
    }
}


@ToString(includeNames=true, includePackage=false)
class SearchPedido {
    Date fechaInicial
    Date fechaFinal
}

@ToString(includeNames=true, includePackage=false)
class EnvioDeFactura {

    String sourceEmail 
    String targetEmail 
    String factura
    String pdfPath 
    String xmlPath

    static constraints = {
        sourceEmail nullable: true
    }
}

