from django.contrib import admin
from .models import Package, PackageEvent

admin.site.register(Package)
admin.site.register(PackageEvent)
