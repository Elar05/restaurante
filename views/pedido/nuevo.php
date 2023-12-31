<?php require_once 'views/layout/head.php'; ?>

<link rel="stylesheet" href="<?= URL ?>/public/bundles/datatables/datatables.min.css">
<link rel="stylesheet" href="<?= URL ?>/public/bundles/datatables/DataTables-1.10.16/css/dataTables.bootstrap4.min.css">

<?php require_once 'views/layout/header.php'; ?>

<!-- Main Content -->
<div class="main-content">
  <section class="section">
    <div class="section-body mx-auto">
      <form id="form_pedido" class="row mt-3" method="post" novalidate>
        <input type="hidden" name="id" id="id">
        <input type="hidden" name="items" id="items">
        <input type="hidden" name="action" id="action" value="create">

        <div class="col-3">
          <div class="card">
            <div class="card-header">
              <h6 class="m-0">Datos del cliente</h6>
            </div>
            <div class="card-body">
              <?php require_once 'views/cliente/inputs.php'; ?>
            </div>
          </div>
        </div>

        <div class="col-4">
          <div class="card">
            <div class="card-header">
              <h6 class="m-0">Datos del pedido</h6>
            </div>

            <div class="card-body">
              <div class="form-group">
                <label for="tipo">Tipo de Pedido</label>
                <select name="tipo" id="tipo" class="form-control" required>
                  <option value="local">Local</option>
                  <option value="delivery">Delivery</option>
                </select>

                <div class="invalid-feedback">
                  Oh no! pedido is invalid.
                </div>
              </div>

              <div id="group_delivery" class="d-none">
                <div class="form-group">
                  <label for="direccionDelivery">Dirección de delivery</label>
                  <input type="text" id="direccionDelivery" name="direccionDelivery" class="form-control">

                  <div class="invalid-feedback">
                    Oh no! pedido is invalid.
                  </div>
                </div>

                <div class="form-group">
                  <label for="costoDelivery">Costo del delivery</label>
                  <input type="text" id="costoDelivery" name="costoDelivery" class="form-control">

                  <div class="invalid-feedback">
                    Oh no! pedido is invalid.
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="comprobante">Comprobante</label>
                <select name="comprobante" id="comprobante" class="form-control" required>
                  <option value="B">Boleta</option>
                  <option value="F">Factura</option>
                </select>

                <div class="invalid-feedback">
                  Seleccione un comprobante
                </div>
              </div>
              <div class="form-group">
                <label for="pago">Método de pago</label>
                <select name="pago" id="pago" class="form-control" required>
                  <?php foreach ($this->d['metodosPago'] as $pago) : ?>
                    <option value="<?= $pago['idPago'] ?>"><?= $pago['nombre'] ?></option>
                  <?php endforeach; ?>
                </select>

                <div class="invalid-feedback">
                  Seleccione un pago
                </div>
              </div>
              <div class="form-group">
                <label for="descripcion">Descripción</label>
                <input name="descripcion" id="descripcion" class="form-control" required>

                <div class="invalid-feedback">
                  Seleccione un descripcion
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-5">
          <div class="card">
            <div class="card-body">
              <h6>Productos disponibles</h6>
              <table class="table table-striped table-sm w-100" id="tableItems">
                <thead>
                  <tr>
                    <th>Desc.</th>
                    <th>Categoria</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>

              <h6 class="mt-3">Productos a comprar</h6>
              <table class="table table-sm w-100">
                <thead>
                  <tr>
                    <th>Desc.</th>
                    <th style="width: 110px;">Precio</th>
                    <th>Cantidad</th>
                    <th style="width: 120px;">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="tbody_detalle"></tbody>
              </table>

              <div class="d-flex">
                <div class="form-group">
                  <label for="subtotal">Subtotal</label>
                  <input name="subtotal" id="subtotal" class="form-control" required>
                </div>
                <div class="form-group">
                  <label for="igv">IGV</label>
                  <input name="igv" id="igv" class="form-control" required>
                </div>
                <div class="form-group">
                  <label for="total">Total</label>
                  <input name="total" id="total" class="form-control" required>
                </div>
              </div>

              <div class="mt-2 text-right">
                <button type="submit" class="btn btn-primary">Registrar pedido</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </section>
</div>

<?php require_once 'views/layout/footer.php'; ?>

<script src="<?= URL ?>/public/bundles/datatables/datatables.min.js"></script>
<script src="<?= URL ?>/public/bundles/datatables/DataTables-1.10.16/js/dataTables.bootstrap4.min.js"></script>

<script src="<?= URL ?>/public/js/pedido.js" type="module"></script>

<?php require_once 'views/layout/foot.php'; ?>