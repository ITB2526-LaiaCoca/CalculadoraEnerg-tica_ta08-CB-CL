import json
from datetime import datetime

# Cargar datos
with open("dataclean.json", "r") as f:
    data = json.load(f)

# Funciones base
def filter_by_category(data, category):
    return [item for item in data if item["category"] == category]

def filter_by_date_range(data, start, end):
    start_dt = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")
    return [item for item in data if item["date"] and start_dt <= datetime.strptime(item["date"], "%Y-%m-%d") <= end_dt]

# Funciones de cálculo
def total_consumption(data):
    return sum(float(item.get("consumption") or 0) for item in data)

def total_quantity(data):
    return sum(float(item.get("quantity") or 0) for item in data)

def prediction_next_year(data):
    days = {d["date"] for d in data if d.get("date")}
    total = total_consumption(data)
    avg_per_day = total / len(days) if days else 0
    return avg_per_day * 365

def prediction_next_year_quantity(data):
    months = {d["date"][:7] for d in data if d.get("date")}
    total = total_quantity(data)
    avg_per_month = total / len(months) if months else 0
    return avg_per_month * 12

# Resultados
electricity = filter_by_category(data, "pv_electricity")
next_year_electricity = prediction_next_year(electricity)
elec_period = filter_by_date_range(electricity, "2024-09-01", "2025-06-30")
total_elec_period = total_consumption(elec_period)

water = filter_by_category(data, "water")
next_year_water = prediction_next_year(water)
water_period = filter_by_date_range(water, "2024-09-01", "2025-06-30")
total_water_period = total_consumption(water_period)

office = filter_by_category(data, "office_supply")
# Agrupar por description
office_items = {}
for item in office:
    desc = item.get("description", "desconocido")
    if desc not in office_items:
        office_items[desc] = {"quantity": 0, "period": 0}
    office_items[desc]["quantity"] += float(item.get("quantity") or 0)
    if "2024-09-01" <= item["date"] <= "2025-06-30":
        office_items[desc]["period"] += float(item.get("quantity") or 0)

cleaning = filter_by_category(data, "cleaning_product")
cleaning_items = {}
for item in cleaning:
    desc = item.get("description", "desconocido")
    if desc not in cleaning_items:
        cleaning_items[desc] = {"quantity": 0, "period": 0}
    cleaning_items[desc]["quantity"] += float(item.get("quantity") or 0)
    if "2024-09-01" <= item["date"] <= "2025-06-30":
        cleaning_items[desc]["period"] += float(item.get("quantity") or 0)

# Mostrar resultados
print(f"pv_electricity próximo año escolar: {next_year_electricity:.2f} kWh")
print(f"pv_electricity periodo escolar: {total_elec_period:.2f} kWh\n")

print(f"water próximo año escolar: {next_year_water:.2f} L")
print(f"water periodo escolar: {total_water_period:.2f} L\n")

print("office_supply (detalle por ítem):")
for desc, vals in office_items.items():
    print(f"  {desc}: {vals['quantity']:.2f} uds próximo año escolar, {vals['period']:.2f} uds periodo escolar")

print("\ncleaning_product (detalle por ítem):")
for desc, vals in cleaning_items.items():
    print(f"  {desc}: {vals['quantity']:.2f} uds próximo año escolar, {vals['period']:.2f} uds periodo escolar")