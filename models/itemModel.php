<?php

namespace Models;

use PDO;
use PDOException;
use Libs\Model;

class ItemModel extends Model
{
  public $idItem;
  public $idcategoria;
  public $tipo;
  public $precio_c;
  public $precio_v;
  public $stock;
  public $stock_min;
  public $descripcion;
  public $f_registro;
  public $estado;
  public $foto;
  

  public function __construct()
  {
    parent::__construct();
  }

  public function get($id, $colum = "idItem")
  {
    try {
      $query = $this->prepare("SELECT * FROM item WHERE $colum = ?;");
      $query->execute([$id]);
      return $query->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
      error_log("UserModel::get() -> " . $e->getMessage());
      return false;
    }
  }

  public function getAll($colum = null, $value = null)
  {
    try {
      $sql = "";
      if ($colum !== null && $value !== null) $sql = " WHERE $colum = '$value'";

      $query = $this->query("SELECT i.*, c.nombre AS categoria FROM item i JOIN categoria c ON i.idcategoria = c.idCategoria $sql;");
      $query->execute();
      return $query->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
      error_log("UserModel::getAll() -> " . $e->getMessage());
      return false;
    }
  }

  public function save()
  {
    try {
      $query = $this->prepare("INSERT INTO item (idcategoria, tipo, precio_c, precio_v, stock, stock_min, descripcion, foto) 
      VALUES (:idcategoria, :tipo, :precio_c, :precio_v, :stock, :stock_min, :descripcion, :foto);");

      $query->bindParam(':idcategoria', $this->idcategoria, PDO::PARAM_STR);
      $query->bindParam(':tipo', $this->tipo, PDO::PARAM_STR);
      $query->bindParam(':precio_c', $this->precio_c, PDO::PARAM_STR);
      $query->bindParam(':precio_v', $this->precio_v, PDO::PARAM_STR);
      $query->bindParam(':stock', $this->stock, PDO::PARAM_STR);
      $query->bindParam(':stock_min', $this->stock_min, PDO::PARAM_STR);
      $query->bindParam(':descripcion', $this->stock_min, PDO::PARAM_STR);
      $query->bindParam(':foto', $this->foto, PDO::PARAM_STR);
      
      return $query->execute();
    } catch (PDOException $e) {
      error_log("ItemModel::save() -> " . $e->getMessage());
      return false;
    }
  }

  public function update()
  {
    try {
      $query = $this->prepare("UPDATE item SET idcategoria = :idcategoria, tipo = :tipo, precio_c = :precio_c, precio_v = :precio_v, stock = :stock, stock_min = :stock_min, foto = :foto, descripcion = :descripcion WHERE idItem = :idItem;");

      return $query->execute([
        'idItem' => $this->idItem,
        'idcategoria' => $this->idcategoria,
        'tipo' => $this->tipo,
        'precio_c' => $this->precio_c,
        'precio_v' => $this->precio_v,
        'stock' => $this->stock,
        'stock_min' => $this->stock_min,
        'descripcion' => $this->descripcion,
        'foto' => $this->foto
      ]);
    } catch (PDOException $e) {
      error_log("UserModel::update() -> " . $e->getMessage());
      return false;
    }
  }

  public function updateStatus()
  {
    try {
      $query = $this->prepare("UPDATE item SET estado = :estado WHERE idItem=:idItem;");
      $query->bindParam(':estado', $this->estado, PDO::PARAM_STR);
      $query->bindParam(':idItem', $this->idItem, PDO::PARAM_STR);
      return $query->execute();
    } catch (PDOException $e) {
      error_log("MarcaModel::update() -> " . $e->getMessage());
      return false;
    }
  }
}