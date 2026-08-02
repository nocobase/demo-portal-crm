import { useList, useTranslate } from "@refinedev/core";
import { Boxes, CheckCircle2, DollarSign, PackageCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingState } from "@/components/app-shell/loading-state";
import { ListView } from "@/components/resources/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRODUCT_CATEGORIES, formatCurrency, labelFor } from "../constants";
import { MetricCard } from "../overview-cards";
import { EnumBadge, useLocale } from "../shared";
import type { ProductRecord } from "../types";

export function ProductsPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { result, query } = useList<ProductRecord>({
    resource: "crm_products",
    pagination: { mode: "server", currentPage: 1, pageSize: 200 },
    sorters: [{ field: "name", order: "asc" }],
    errorNotification: false,
    queryOptions: { retry: false },
  });
  const products = result.data;
  const visible = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return products.filter((product) =>
      (category === "all" || product.category === category) &&
      (!needle || [product.name, product.sku].some((value) => value?.toLowerCase().includes(needle)))
    );
  }, [category, products, search]);
  const active = products.filter((product) => product.active).length;
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.unit_price ?? 0), 0) / products.length
    : 0;

  return (
    <ListView resource="crm_products">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={translate("crm.products.metrics.skus", { ns: "starter" }, "Price book SKUs")} value={products.length} icon={<Boxes className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.products.metrics.active", { ns: "starter" }, "Active products")} value={active} detail={translate("crm.products.metrics.activeDetail", { ns: "starter" }, "Available for new quote items")} icon={<PackageCheck className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.products.metrics.average", { ns: "starter" }, "Average list price")} value={formatCurrency(averagePrice, locale)} icon={<DollarSign className="size-5" />} loading={query.isLoading} />
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:justify-between">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder={translate("crm.products.search", { ns: "starter" }, "Search product or SKU")} />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue>{category === "all" ? translate("crm.products.allCategories", { ns: "starter" }, "All categories") : labelFor(PRODUCT_CATEGORIES, category, translate)}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("crm.products.allCategories", { ns: "starter" }, "All categories")}</SelectItem>
              {PRODUCT_CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{labelFor(PRODUCT_CATEGORIES, item.value, translate)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {query.isLoading ? <LoadingState className="min-h-96" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{translate("crm.products.fields.sku", { ns: "starter" }, "SKU")}</TableHead>
                <TableHead>{translate("crm.products.fields.name", { ns: "starter" }, "Product")}</TableHead>
                <TableHead>{translate("crm.products.fields.category", { ns: "starter" }, "Category")}</TableHead>
                <TableHead className="text-right">{translate("crm.products.fields.price", { ns: "starter" }, "Unit price")}</TableHead>
                <TableHead>{translate("crm.products.fields.active", { ns: "starter" }, "Availability")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{visible.map((product) => (
                <TableRow key={String(product.id)}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge></TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell><EnumBadge value={product.category} label={labelFor(PRODUCT_CATEGORIES, product.category, translate)} /></TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(product.unit_price, locale)}</TableCell>
                  <TableCell>{product.active ? <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" />{translate("crm.products.active", { ns: "starter" }, "Active")}</span> : <span className="text-sm text-muted-foreground">{translate("crm.products.inactive", { ns: "starter" }, "Inactive")}</span>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </div>
    </ListView>
  );
}
