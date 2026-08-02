import { useList, useTranslate } from "@refinedev/core";
import { Boxes, CheckCircle2, DollarSign, Eye, PackageCheck, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingState } from "@/components/app-shell/loading-state";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { ListView } from "@/components/resources/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpenContextualChild } from "../route-surfaces";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRODUCT_CATEGORIES, formatCurrency, labelFor } from "../constants";
import {
  ListFilterSelect,
  ListPagination,
  ListSearchInput,
  ListToolbar,
  searchFilter,
  useDebouncedValue,
  useListPagination,
  useResetPageOnFilterChange,
} from "../list-controls";
import { MetricCard } from "../overview-cards";
import { EnumBadge, useLocale } from "../shared";
import type { ProductRecord } from "../types";

export function ProductsPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const openChild = useOpenContextualChild();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const debouncedSearch = useDebouncedValue(search);
  const { currentPage, pageSize, setCurrentPage, setPageSize } =
    useListPagination();

  const filters = useMemo(
    () => [
      ...searchFilter(["name", "sku"], debouncedSearch),
      ...(category === "all"
        ? []
        : [{ field: "category", operator: "eq" as const, value: category }]),
      ...(availability === "all"
        ? []
        : [
            {
              field: "active",
              operator: "eq" as const,
              value: availability === "active",
            },
          ]),
    ],
    [availability, category, debouncedSearch]
  );
  useResetPageOnFilterChange(
    `${debouncedSearch}|${category}|${availability}`,
    setCurrentPage
  );

  const { result, query } = useList<ProductRecord>({
    resource: "crm_products",
    filters,
    pagination: { mode: "server", currentPage, pageSize },
    sorters: [{ field: "name", order: "asc" }],
    errorNotification: false,
    queryOptions: { retry: false },
  });
  // Price-book metrics stay whole-catalogue while the table is filtered.
  const summary = useList<ProductRecord>({
    resource: "crm_products",
    pagination: { mode: "server", currentPage: 1, pageSize: 500 },
    meta: { fields: ["id", "active", "unit_price"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const visible = result.data;
  const products = summary.result.data;
  const active = products.filter((product) => product.active).length;
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.unit_price ?? 0), 0) / products.length
    : 0;

  const categoryOptions = useMemo(
    () =>
      PRODUCT_CATEGORIES.map((item) => ({
        value: item.value,
        label: labelFor(PRODUCT_CATEGORIES, item.value, translate),
      })),
    [translate]
  );
  const availabilityOptions = useMemo(
    () => [
      { value: "active", label: translate("crm.products.active", { ns: "starter" }, "Active") },
      { value: "inactive", label: translate("crm.products.inactive", { ns: "starter" }, "Inactive") },
    ],
    [translate]
  );

  return (
    <ListView resource="crm_products">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={translate("crm.products.metrics.skus", { ns: "starter" }, "Price book SKUs")} value={summary.result.total ?? products.length} icon={<Boxes className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.products.metrics.active", { ns: "starter" }, "Active products")} value={active} detail={translate("crm.products.metrics.activeDetail", { ns: "starter" }, "Available for new quote items")} icon={<PackageCheck className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.products.metrics.average", { ns: "starter" }, "Average list price")} value={formatCurrency(averagePrice, locale)} icon={<DollarSign className="size-5" />} loading={summary.query.isLoading} />
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListSearchInput
            value={search}
            onChange={setSearch}
            placeholder={translate("crm.products.search", { ns: "starter" }, "Search product or SKU")}
          />
          <ListFilterSelect
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            allLabel={translate("crm.products.allCategories", { ns: "starter" }, "All categories")}
          />
          <ListFilterSelect
            value={availability}
            onChange={setAvailability}
            options={availabilityOptions}
            allLabel={translate("crm.products.allAvailability", { ns: "starter" }, "Any availability")}
          />
        </ListToolbar>
        {query.isLoading ? <LoadingState className="min-h-96" /> : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{translate("crm.products.fields.sku", { ns: "starter" }, "SKU")}</TableHead>
                  <TableHead>{translate("crm.products.fields.name", { ns: "starter" }, "Product")}</TableHead>
                  <TableHead>{translate("crm.products.fields.category", { ns: "starter" }, "Category")}</TableHead>
                  <TableHead className="text-right">{translate("crm.products.fields.price", { ns: "starter" }, "Unit price")}</TableHead>
                  <TableHead>{translate("crm.products.fields.active", { ns: "starter" }, "Availability")}</TableHead>
                  <TableHead className="w-24"><span className="sr-only">{translate("crm.common.actions", { ns: "starter" }, "Actions")}</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>{visible.map((product) => (
                  <TableRow key={String(product.id)} className="cursor-pointer" onClick={() => openChild(`show/${product.id}`)}>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge></TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell><EnumBadge value={product.category} label={labelFor(PRODUCT_CATEGORIES, product.category, translate)} /></TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(product.unit_price, locale)}</TableCell>
                    <TableCell>{product.active ? <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" />{translate("crm.products.active", { ns: "starter" }, "Active")}</span> : <span className="text-sm text-muted-foreground">{translate("crm.products.inactive", { ns: "starter" }, "Inactive")}</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`show/${product.id}`); }}>
                          <Eye /><span className="sr-only">{translate("crm.products.actions.view", { ns: "starter" }, "View product")}</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`edit/${product.id}`); }}>
                          <Pencil /><span className="sr-only">{translate("crm.products.actions.edit", { ns: "starter" }, "Edit product")}</span>
                        </Button>
                        <DeleteButton resource="crm_products" recordItemId={product.id} variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 />
                        </DeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
              {visible.length === 0 ? (
                <p className="px-4 py-14 text-center text-sm text-muted-foreground">{translate("crm.products.empty", { ns: "starter" }, "No products match the current filters.")}</p>
              ) : null}
            </div>
            <ListPagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={result.total ?? visible.length}
              setCurrentPage={setCurrentPage}
              setPageSize={setPageSize}
            />
          </>
        )}
      </div>
    </ListView>
  );
}
