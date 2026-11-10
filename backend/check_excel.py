# وارد کردن ابزار خواندن فایل اکسل
from openpyxl import load_workbook

# باز کردن فایل اکسل منوی رستوران
workbook = load_workbook("menu.xlsx", data_only=True)

# نمایش نام تمام شیت‌های فایل
print("نام شیت‌ها:")
for sheet_name in workbook.sheetnames:
    print(sheet_name)

# انتخاب شیت اصلی منو
sheet = workbook["کل منو (جامع)"]

# نمایش عنوان ستون‌ها
print("\nعنوان ستون‌ها:")
for cell in sheet[1]:
    print(cell.value)

# نمایش تعداد محصولات بدون احتساب ردیف عنوان
print("\nتعداد ردیف‌های محصولات:")
print(sheet.max_row - 1)

# نمایش ۱۰ محصول اول برای بررسی اطلاعات و قیمت‌ها
print("\n۱۰ محصول اول:")

for row in sheet.iter_rows(min_row=2, max_row=11, values_only=True):
    # نمایش اطلاعات هر محصول به‌صورت یک ردیف
    print(row)



# بررسی محصولاتی که حداقل یکی از قیمت‌های سایزی را دارند
print("\nمحصولات دارای قیمت سایزی:")

for row in sheet.iter_rows(min_row=2, values_only=True):
    # دریافت قیمت‌های مینی، متوسط و بزرگ
    mini_price = row[5]
    medium_price = row[6]
    large_price = row[7]

    # نمایش محصول در صورت داشتن حداقل یک قیمت سایزی
    if any(price is not None for price in (mini_price, medium_price, large_price)):
        print(row)


# بررسی ساندویچ‌هایی که قیمت سایزی دارند
print("\nساندویچ‌های دارای قیمت سایزی:")

for row in sheet.iter_rows(min_row=2, values_only=True):
    # دریافت دسته‌بندی محصول
    category = row[1]

    # دریافت قیمت‌های سایزی
    mini_price = row[5]
    medium_price = row[6]
    large_price = row[7]

    # بررسی ساندویچ بودن محصول و داشتن قیمت سایزی
    if category and "ساندویچ" in category:
        if any(price is not None for price in (mini_price, medium_price, large_price)):
            print(row)