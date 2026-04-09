import json
from datetime import datetime
from collections import defaultdict

# Cargar datos
with open("dataclean.json", "r") as f:
    data = json.load(f)

# Filtrar por curso escolar (septiembre a junio)
def filter_by_school_year(data):
    filtered = []
    for item in data:
        fecha = item.get("date")
        if not fecha:
            continue
        d = datetime.strptime(fecha, "%Y-%m-%d")
        if 9 <= d.month <= 12 or 1 <= d.month <= 6:
            filtered.append(item)
    return filtered

# Filtrar por categoría
def filter_by_category(data, category):
    return [item for item in data if item.get("category") == category]

# Total consumo
def total_consumption(data):
    total = 0
    for item in data:
        try:
            total += float(item.get("consumption") or 0)
        except:
            continue
    return total

# Total cantidad (para oficina/limpieza)
def total_quantity(data):
    total = 0
    for item in data:
        try:
            total += float(item.get("quantity") or 0)
        except:
            continue
    return total

# Total coste
def total_cost(data):
    total = 0
    for item in data:
        try:
            total += float(item.get("total_import") or 0)
        except:
            continue
    return total

# Media diaria agrupando por día
def daily_average_global(data):
    daily_sums = defaultdict(float)
    for item in data:
        date_str = item.get("date")
        if not date_str or not item.get("consumption"):
            continue
        try:
            daily_sums[date_str] += float(item["consumption"])
        except:
            continue
    if not daily_sums:
        return 0
    return sum(daily_sums.values()) / len(daily_sums)

# Datos del curso escolar
school_data = filter_by_school_year(data)

# Parámetros de estimación
dias_mes = 30
meses_curso = 10

# -------------------- ELECTRICIDAD --------------------
electricity = filter_by_category(school_data, "pv_electricity")
total_elec = total_consumption(electricity)
daily_avg_elec = daily_average_global(electricity)
cost_total_elec = total_cost(electricity)
estimacion_mes_elec = daily_avg_elec * dias_mes
coste_mes_elec = (cost_total_elec / len(set(item["date"] for item in electricity))) * dias_mes if electricity else 0
estimacion_curso_elec = estimacion_mes_elec * meses_curso
coste_curso_elec = coste_mes_elec * meses_curso

# -------------------- AGUA --------------------
water = filter_by_category(school_data, "water")
total_water = total_consumption(water)
daily_avg_water = daily_average_global(water)
cost_total_water = total_cost(water)
estimacion_mes_agua = daily_avg_water * dias_mes
coste_mes_agua = (cost_total_water / len(set(item["date"] for item in water))) * dias_mes if water else 0
estimacion_curso_agua = estimacion_mes_agua * meses_curso
coste_curso_agua = coste_mes_agua * meses_curso

# -------------------- MATERIAL DE OFICINA --------------------
office = filter_by_category(school_data, "office_supply")
office_items = defaultdict(float)
for item in office:
    desc = item.get("description", "desconocido")
    try:
        office_items[desc] += float(item.get("quantity") or 0)
    except:
        continue
total_office = total_quantity(office)
office_cost_total = total_cost(office)
office_days = len(set(item["date"] for item in office))
office_per_month_qty = total_office / (office_days/30) if office_days else 0
office_per_month_cost = office_cost_total / (office_days/30) if office_days else 0

# -------------------- PRODUCTOS DE LIMPIEZA --------------------
cleaning = filter_by_category(school_data, "cleaning_product")
cleaning_items = defaultdict(float)
for item in cleaning:
    desc = item.get("description", "desconocido")
    try:
        cleaning_items[desc] += float(item.get("quantity") or 0)
    except:
        continue
total_cleaning = total_quantity(cleaning)
cleaning_cost_total = total_cost(cleaning)
cleaning_days = len(set(item["date"] for item in cleaning))
cleaning_per_month_qty = total_cleaning / (cleaning_days/30) if cleaning_days else 0
cleaning_per_month_cost = cleaning_cost_total / (cleaning_days/30) if cleaning_days else 0

# -------------------- MOSTRAR RESULTADOS --------------------
print("Electricidad Fotovoltaica")
print(f"Total curso escolar: {total_elec:.2f} kWh")
print(f"Media diaria global: {daily_avg_elec:.2f} kWh/día")
print(f"Coste total electricidad: {cost_total_elec:.2f} €")
print(f"Estimación mensual: {estimacion_mes_elec:.2f} kWh, coste: {coste_mes_elec:.2f} €")
print(f"Estimación curso escolar: {estimacion_curso_elec:.2f} kWh, coste: {coste_curso_elec:.2f} €\n")

print("Agua")
print(f"Total curso escolar: {total_water:.2f} L")
print(f"Media diaria global: {daily_avg_water:.2f} L/día")
print(f"Coste total agua: {cost_total_water:.2f} €")
print(f"Estimación mensual: {estimacion_mes_agua:.2f} L, coste: {coste_mes_agua:.2f} €")
print(f"Estimación curso escolar: {estimacion_curso_agua:.2f} L, coste: {coste_curso_agua:.2f} €\n")

print("Material de Oficina:")
for desc, qty in office_items.items():
    print(f"  {desc}: {qty:.2f} uds")
print(f"Total materiales de oficina: {total_office:.2f} uds")
print(f"Estimación mensual: {office_per_month_qty:.2f} uds, coste: {office_per_month_cost:.2f} €")
print(f"Estimación curso escolar: {total_office:.2f} uds, coste: {office_cost_total:.2f} €\n")

print("Productos de Limpieza:")
for desc, qty in cleaning_items.items():
    print(f"  {desc}: {qty:.2f} uds")
print(f"Total productos de limpieza: {total_cleaning:.2f} uds")
print(f"Estimación mensual: {cleaning_per_month_qty:.2f} uds, coste: {cleaning_per_month_cost:.2f} €")
print(f"Estimación curso escolar: {total_cleaning:.2f} uds, coste: {cleaning_cost_total:.2f} €")