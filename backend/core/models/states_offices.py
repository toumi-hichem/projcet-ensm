from django.db import models


class State(models.Model):
    gid_1 = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100, db_index=True)
    varname = models.CharField(max_length=100, null=True, blank=True)
    nl_name = models.CharField(max_length=100, null=True, blank=True)
    code = models.CharField(max_length=10, null=True, blank=True, db_index=True)
    iso = models.CharField(max_length=10, null=True, blank=True)
    country = models.CharField(max_length=100)
    geometry = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.name


class PostalOffice(models.Model):
    name = models.CharField(max_length=150, db_index=True)
    state = models.ForeignKey(
        State, related_name="postal_offices", on_delete=models.CASCADE, db_index=True
    )

    class Meta:
        verbose_name = "Postal Office"
        verbose_name_plural = "Postal Offices"

    def __str__(self):
        return f"{self.name} ({self.state.name})"
