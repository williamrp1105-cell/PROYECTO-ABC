import json

def inventario_final(inventario_inicial, produccion_historica, ventas_historicas):
    return inventario_inicial + produccion_historica - ventas_historicas

def produccion_requerida(ventas_pronosticadas, inventario_final_deseado, inventario_inicial):
    return ventas_pronosticadas + inventario_final_deseado - inventario_inicial

def costo_variable(tasa, unidades_requeridas):
    return tasa * unidades_requeridas

def main():
    print(json.dumps({
        'success': True,
        'message': 'Motor ABC disponible. La aplicación web realiza los cálculos directamente con los datos ingresados.'
    }))

if __name__ == '__main__':
    main()
