"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/serverless.ts
var serverless_exports = {};
__export(serverless_exports, {
  default: () => handler
});
module.exports = __toCommonJS(serverless_exports);

// src/app.ts
var import_fastify = __toESM(require("fastify"));
var import_cors = __toESM(require("@fastify/cors"));
var import_swagger = __toESM(require("@fastify/swagger"));
var import_swagger_ui = __toESM(require("@fastify/swagger-ui"));
var import_fastify_type_provider_zod = require("fastify-type-provider-zod");

// src/config/env.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  PORT: import_zod.z.coerce.number().default(3333),
  HOST: import_zod.z.string().default("0.0.0.0").transform((val) => val === "127.0.0.0" ? "0.0.0.0" : val),
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: import_zod.z.string().url("SUPABASE_URL deve ser uma URL v\xE1lida").transform((url) => url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "")),
  SUPABASE_SERVICE_ROLE_KEY: import_zod.z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY \xE9 obrigat\xF3ria"),
  CORS_ORIGIN: import_zod.z.string().default("*")
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
  const formatted = JSON.stringify(_env.error.format(), null, 2);
  console.error("\u274C Configura\xE7\xE3o inv\xE1lida de vari\xE1veis de ambiente:\n", formatted);
  throw new Error(`Configura\xE7\xE3o inv\xE1lida de vari\xE1veis de ambiente: ${formatted}`);
}
var env = _env.data;

// src/shared/errors/error-handler.ts
var import_zod2 = require("zod");

// src/shared/errors/app-error.ts
var AppError = class extends Error {
  statusCode;
  details;
  constructor(message, statusCode = 400, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var NotFoundError = class extends AppError {
  constructor(message = "Recurso n\xE3o encontrado", details) {
    super(message, 404, details);
  }
};
var BadRequestError = class extends AppError {
  constructor(message = "Requisi\xE7\xE3o inv\xE1lida", details) {
    super(message, 400, details);
  }
};

// src/shared/errors/error-handler.ts
function errorHandler(error, request, reply) {
  request.log.error(error);
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
      details: error.details
    });
  }
  if (error instanceof import_zod2.ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Erro de valida\xE7\xE3o nos dados fornecidos",
      issues: error.flatten().fieldErrors
    });
  }
  if ("validation" in error && error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: error.message || "Erro de valida\xE7\xE3o nos par\xE2metros da requisi\xE7\xE3o",
      issues: error.validation
    });
  }
  const anyError = error;
  if (anyError?.code && typeof anyError.code === "string") {
    if (anyError.code === "PGRST116") {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: "Registro n\xE3o encontrado no banco de dados"
      });
    }
    if (anyError.code === "23505") {
      return reply.status(409).send({
        statusCode: 409,
        error: "Conflict",
        message: "Registro duplicado encontrado",
        details: anyError.details
      });
    }
  }
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    statusCode,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "Ocorreu um erro interno no servidor." : error.message || "Erro interno"
  });
}

// src/database/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = (0, import_supabase_js.createClient)(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseClient;
}
var supabase = getSupabaseClient();

// src/modules/menu/menu.repository.ts
var MenuRepository = class {
  async getItemsForDay(day) {
    const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true).in("day_of_week", [day, "TODOS_OS_DIAS"]).order("display_order", { ascending: true });
    if (error) {
      throw error;
    }
    return data || [];
  }
  async getAllActiveItems() {
    const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true).order("display_order", { ascending: true });
    if (error) {
      throw error;
    }
    return data || [];
  }
  async getActiveAddons() {
    const { data, error } = await supabase.from("menu_addons").select("*").eq("is_available", true).order("display_order", { ascending: true });
    if (error) {
      throw error;
    }
    return data || [];
  }
  async findItemsByIds(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("menu_items").select("*").in("id", ids);
    if (error) {
      throw error;
    }
    return data || [];
  }
  async findAddonsByIds(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("menu_addons").select("*").in("id", ids);
    if (error) {
      throw error;
    }
    return data || [];
  }
};

// src/modules/settings/settings.repository.ts
var SettingsRepository = class {
  async getSettings() {
    const { data, error } = await supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
};

// src/shared/utils/date.ts
var SAO_PAULO_TZ = "America/Sao_Paulo";
var DAY_MAP = {
  0: "DOMINGO",
  1: "SEGUNDA",
  2: "TERCA",
  3: "QUARTA",
  4: "QUINTA",
  5: "SEXTA",
  6: "SABADO"
};
var DAY_NAMES_PT = {
  DOMINGO: "Domingo",
  SEGUNDA: "Segunda-feira",
  TERCA: "Ter\xE7a-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "S\xE1bado",
  TODOS_OS_DIAS: "Todos os Dias"
};
function getCurrentDayOfWeek(date = /* @__PURE__ */ new Date()) {
  const spDate = new Date(date.toLocaleString("en-US", { timeZone: SAO_PAULO_TZ }));
  const dayIndex = spDate.getDay();
  return DAY_MAP[dayIndex] || "SEGUNDA";
}
function isWithinBusinessHours(openingTimeStr, closingTimeStr, currentDate = /* @__PURE__ */ new Date()) {
  if (!openingTimeStr || !closingTimeStr) return true;
  const spDate = new Date(currentDate.toLocaleString("en-US", { timeZone: SAO_PAULO_TZ }));
  const currentMinutes = spDate.getHours() * 60 + spDate.getMinutes();
  const [openH, openM] = openingTimeStr.split(":").map(Number);
  const [closeH, closeM] = closingTimeStr.split(":").map(Number);
  const openTotal = (openH ?? 0) * 60 + (openM ?? 0);
  const closeTotal = (closeH ?? 0) * 60 + (closeM ?? 0);
  return currentMinutes >= openTotal && currentMinutes <= closeTotal;
}

// src/modules/menu/menu.service.ts
var MenuService = class {
  constructor(menuRepository = new MenuRepository(), settingsRepository = new SettingsRepository()) {
    this.menuRepository = menuRepository;
    this.settingsRepository = settingsRepository;
  }
  menuRepository;
  settingsRepository;
  mapMenuItem(item) {
    return {
      id: item.id,
      category: item.category,
      day_of_week: item.day_of_week,
      option_label: item.option_label,
      name: item.name,
      ingredients: item.ingredients,
      has_salad: Boolean(item.has_salad),
      price: Number(item.price),
      image_url: item.image_url,
      is_available: item.is_available,
      display_order: item.display_order
    };
  }
  mapAddon(addon) {
    return {
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
      is_available: addon.is_available,
      display_order: addon.display_order
    };
  }
  async getTodayMenu() {
    const currentDay = getCurrentDayOfWeek();
    const dayName = DAY_NAMES_PT[currentDay];
    if (currentDay === "DOMINGO") {
      return {
        day_of_week: currentDay,
        day_name: dayName,
        is_open: false,
        message: "A marmitaria n\xE3o funciona aos domingos. Esperamos voc\xEA de segunda a s\xE1bado!",
        dishes: [],
        beverages: [],
        addons: []
      };
    }
    const [settings, items, addons] = await Promise.all([
      this.settingsRepository.getSettings(),
      this.menuRepository.getItemsForDay(currentDay),
      this.menuRepository.getActiveAddons()
    ]);
    const isScheduleActive = settings ? isWithinBusinessHours(settings.opening_time, settings.closing_time) : true;
    const isRestaurantOpen = (settings ? settings.is_open : true) && isScheduleActive;
    const dishes = items.filter((item) => item.category === "PRATO_DO_DIA").map(this.mapMenuItem);
    const beverages = items.filter((item) => item.category === "BEBIDA").map(this.mapMenuItem);
    const mappedAddons = addons.map(this.mapAddon);
    return {
      day_of_week: currentDay,
      day_name: dayName,
      is_open: isRestaurantOpen,
      message: isRestaurantOpen ? void 0 : "No momento a marmitaria est\xE1 fechada para novos pedidos.",
      dishes,
      beverages,
      addons: mappedAddons
    };
  }
  async getWeeklyMenu() {
    const weekdays = [
      "SEGUNDA",
      "TERCA",
      "QUARTA",
      "QUINTA",
      "SEXTA",
      "SABADO"
    ];
    const [allItems, addons] = await Promise.all([
      this.menuRepository.getAllActiveItems(),
      this.menuRepository.getActiveAddons()
    ]);
    const weeklySchedule = weekdays.map((day) => {
      const dayDishes = allItems.filter(
        (item) => item.category === "PRATO_DO_DIA" && (item.day_of_week === day || item.day_of_week === "TODOS_OS_DIAS")
      ).map(this.mapMenuItem);
      return {
        day_of_week: day,
        day_name: DAY_NAMES_PT[day],
        dishes: dayDishes
      };
    });
    const beverages = allItems.filter((item) => item.category === "BEBIDA").map(this.mapMenuItem);
    const mappedAddons = addons.map(this.mapAddon);
    return {
      weekly_schedule: weeklySchedule,
      beverages,
      addons: mappedAddons
    };
  }
};

// src/modules/menu/menu.controller.ts
var MenuController = class {
  constructor(menuService = new MenuService()) {
    this.menuService = menuService;
  }
  menuService;
  getTodayMenu = async (_request, reply) => {
    const todayMenu = await this.menuService.getTodayMenu();
    return reply.status(200).send(todayMenu);
  };
  getWeeklyMenu = async (_request, reply) => {
    const weeklyMenu = await this.menuService.getWeeklyMenu();
    return reply.status(200).send(weeklyMenu);
  };
};

// src/modules/menu/menu.schema.ts
var import_zod3 = require("zod");
var menuItemDtoSchema = import_zod3.z.object({
  id: import_zod3.z.string().uuid(),
  category: import_zod3.z.enum(["PRATO_DO_DIA", "BEBIDA"]),
  day_of_week: import_zod3.z.enum([
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
    "TODOS_OS_DIAS",
    "DOMINGO"
  ]),
  option_label: import_zod3.z.string().nullable(),
  name: import_zod3.z.string(),
  ingredients: import_zod3.z.string().nullable(),
  has_salad: import_zod3.z.boolean(),
  price: import_zod3.z.number().nonnegative(),
  image_url: import_zod3.z.string().nullable(),
  is_available: import_zod3.z.boolean(),
  display_order: import_zod3.z.number()
});
var menuAddonDtoSchema = import_zod3.z.object({
  id: import_zod3.z.string().uuid(),
  name: import_zod3.z.string(),
  price: import_zod3.z.number().nonnegative(),
  is_available: import_zod3.z.boolean(),
  display_order: import_zod3.z.number()
});
var todayMenuResponseSchema = import_zod3.z.object({
  day_of_week: import_zod3.z.string(),
  day_name: import_zod3.z.string(),
  is_open: import_zod3.z.boolean(),
  message: import_zod3.z.string().optional(),
  dishes: import_zod3.z.array(menuItemDtoSchema),
  beverages: import_zod3.z.array(menuItemDtoSchema),
  addons: import_zod3.z.array(menuAddonDtoSchema)
});
var weeklyDayMenuSchema = import_zod3.z.object({
  day_of_week: import_zod3.z.enum(["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"]),
  day_name: import_zod3.z.string(),
  dishes: import_zod3.z.array(menuItemDtoSchema)
});
var weeklyMenuResponseSchema = import_zod3.z.object({
  weekly_schedule: import_zod3.z.array(weeklyDayMenuSchema),
  beverages: import_zod3.z.array(menuItemDtoSchema),
  addons: import_zod3.z.array(menuAddonDtoSchema)
});

// src/modules/menu/menu.routes.ts
async function menuRoutes(app) {
  const controller = new MenuController();
  app.withTypeProvider().get(
    "/menu/today",
    {
      schema: {
        tags: ["Card\xE1pio"],
        summary: "Obter card\xE1pio do dia atual",
        description: "Detecta o dia da semana atual no fuso de S\xE3o Paulo. Se for domingo, retorna isOpen=false. Retorna pratos do dia, bebidas e adicionais.",
        response: {
          200: todayMenuResponseSchema
        }
      }
    },
    controller.getTodayMenu
  );
  app.withTypeProvider().get(
    "/menu/weekly",
    {
      schema: {
        tags: ["Card\xE1pio"],
        summary: "Obter card\xE1pio semanal completo",
        description: "Retorna o card\xE1pio agrupado por dia da semana (Segunda a S\xE1bado) para o modo consulta do aplicativo.",
        response: {
          200: weeklyMenuResponseSchema
        }
      }
    },
    controller.getWeeklyMenu
  );
}

// src/modules/settings/settings.service.ts
var SettingsService = class {
  constructor(settingsRepository = new SettingsRepository()) {
    this.settingsRepository = settingsRepository;
  }
  settingsRepository;
  async getSettings() {
    const settings = await this.settingsRepository.getSettings();
    if (!settings) {
      return {
        id: 1,
        name: "Marmitaria do Dia",
        is_open: true,
        opening_time: "11:00",
        closing_time: "14:30",
        phone_whatsapp: "11999999999",
        pix_key: "contato@marmitariadodia.com.br",
        address_text: "Rua Principal, 123 - Centro",
        takeout_open_time: "11:00",
        currently_open: true
      };
    }
    const currentDay = getCurrentDayOfWeek();
    const isSunday = currentDay === "DOMINGO";
    const isScheduleActive = isWithinBusinessHours(settings.opening_time, settings.closing_time);
    const currentlyOpen = settings.is_open && !isSunday && isScheduleActive;
    return {
      id: settings.id,
      name: settings.name,
      is_open: settings.is_open,
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      phone_whatsapp: settings.phone_whatsapp,
      pix_key: settings.pix_key,
      address_text: settings.address_text,
      takeout_open_time: settings.takeout_open_time,
      currently_open: currentlyOpen
    };
  }
};

// src/modules/settings/settings.controller.ts
var SettingsController = class {
  constructor(settingsService = new SettingsService()) {
    this.settingsService = settingsService;
  }
  settingsService;
  getSettings = async (_request, reply) => {
    const settings = await this.settingsService.getSettings();
    return reply.status(200).send(settings);
  };
};

// src/modules/settings/settings.schema.ts
var import_zod4 = require("zod");
var restaurantSettingsResponseSchema = import_zod4.z.object({
  id: import_zod4.z.number(),
  name: import_zod4.z.string(),
  is_open: import_zod4.z.boolean(),
  opening_time: import_zod4.z.string(),
  closing_time: import_zod4.z.string(),
  phone_whatsapp: import_zod4.z.string(),
  pix_key: import_zod4.z.string(),
  address_text: import_zod4.z.string(),
  takeout_open_time: import_zod4.z.string().nullable(),
  currently_open: import_zod4.z.boolean().describe("Indica se o restaurante est\xE1 aberto considerando o hor\xE1rio atual de S\xE3o Paulo e o status configurado")
});

// src/modules/settings/settings.routes.ts
async function settingsRoutes(app) {
  const controller = new SettingsController();
  app.withTypeProvider().get(
    "/settings",
    {
      schema: {
        tags: ["Configura\xE7\xF5es"],
        summary: "Obter dados do restaurante e status de funcionamento",
        description: "Retorna os dados do restaurante (hor\xE1rio, whatsapp, pix_key, endere\xE7o) e se est\xE1 aberto agora.",
        response: {
          200: restaurantSettingsResponseSchema
        }
      }
    },
    controller.getSettings
  );
}

// src/modules/delivery-zones/delivery-zone.repository.ts
var DeliveryZoneRepository = class {
  async listActive() {
    const { data, error } = await supabase.from("delivery_zones").select("*").eq("is_active", true).order("neighborhood", { ascending: true });
    if (error) {
      throw error;
    }
    return data || [];
  }
  async findById(id) {
    const { data, error } = await supabase.from("delivery_zones").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
  async findByNeighborhood(neighborhood) {
    const { data, error } = await supabase.from("delivery_zones").select("*").ilike("neighborhood", neighborhood.trim()).eq("is_active", true).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
};

// src/modules/delivery-zones/delivery-zone.service.ts
var DeliveryZoneService = class {
  constructor(deliveryZoneRepository = new DeliveryZoneRepository()) {
    this.deliveryZoneRepository = deliveryZoneRepository;
  }
  deliveryZoneRepository;
  async listActiveZones() {
    const zones = await this.deliveryZoneRepository.listActive();
    return zones.map((zone) => ({
      id: zone.id,
      neighborhood: zone.neighborhood,
      delivery_fee: Number(zone.delivery_fee),
      estimated_time_min: zone.estimated_time_min,
      is_active: zone.is_active
    }));
  }
};

// src/modules/delivery-zones/delivery-zone.controller.ts
var DeliveryZoneController = class {
  constructor(deliveryZoneService = new DeliveryZoneService()) {
    this.deliveryZoneService = deliveryZoneService;
  }
  deliveryZoneService;
  listActiveZones = async (_request, reply) => {
    const zones = await this.deliveryZoneService.listActiveZones();
    return reply.status(200).send(zones);
  };
};

// src/modules/delivery-zones/delivery-zone.schema.ts
var import_zod5 = require("zod");
var deliveryZoneItemSchema = import_zod5.z.object({
  id: import_zod5.z.string().uuid(),
  neighborhood: import_zod5.z.string(),
  delivery_fee: import_zod5.z.number().nonnegative(),
  estimated_time_min: import_zod5.z.number().nullable(),
  is_active: import_zod5.z.boolean()
});
var deliveryZonesResponseSchema = import_zod5.z.array(deliveryZoneItemSchema);

// src/modules/delivery-zones/delivery-zone.routes.ts
async function deliveryZoneRoutes(app) {
  const controller = new DeliveryZoneController();
  app.withTypeProvider().get(
    "/delivery-zones",
    {
      schema: {
        tags: ["Taxas e Bairros"],
        summary: "Listar bairros atendidos e taxas de frete",
        description: "Retorna todos os bairros ativos atendidos pela marmitaria com taxa de entrega e tempo estimado.",
        response: {
          200: deliveryZonesResponseSchema
        }
      }
    },
    controller.listActiveZones
  );
}

// src/modules/orders/orders.repository.ts
var OrdersRepository = class {
  async findOrCreateCustomer(data) {
    if (data.id) {
      const { data: existingById } = await supabase.from("profiles").select("*").eq("id", data.id).maybeSingle();
      if (existingById) {
        return existingById;
      }
    }
    const { data: existingByPhone } = await supabase.from("profiles").select("*").eq("phone", data.phone.trim()).maybeSingle();
    if (existingByPhone) {
      return existingByPhone;
    }
    const { data: created, error } = await supabase.from("profiles").insert({
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      role: "CUSTOMER"
    }).select().single();
    if (error) {
      throw error;
    }
    return created;
  }
  async createAddress(addressData) {
    const { data, error } = await supabase.from("addresses").insert({
      user_id: addressData.user_id || null,
      street: addressData.street.trim(),
      number: addressData.number.trim(),
      complement: addressData.complement?.trim() || null,
      neighborhood: addressData.neighborhood.trim(),
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      zip_code: addressData.zip_code?.trim() || null,
      reference_point: addressData.reference_point?.trim() || null,
      is_default: addressData.is_default ?? false
    }).select().single();
    if (error) {
      throw error;
    }
    return data;
  }
  async getAddressById(id) {
    const { data, error } = await supabase.from("addresses").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
  async createOrder(orderData) {
    const { data, error } = await supabase.from("orders").insert(orderData).select().single();
    if (error) {
      throw error;
    }
    return data;
  }
  async createOrderItems(items) {
    const { data, error } = await supabase.from("order_items").insert(items).select();
    if (error) {
      throw error;
    }
    return data || [];
  }
  async createOrderItemAddons(addons) {
    if (addons.length === 0) return [];
    const { data, error } = await supabase.from("order_item_addons").insert(addons).select();
    if (error) {
      throw error;
    }
    return data || [];
  }
  async createOrderStatusHistory(data) {
    const { data: created, error } = await supabase.from("order_status_history").insert(data).select().single();
    if (error) {
      throw error;
    }
    return created;
  }
  async findOrderById(id) {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
  async getOrderCompleteDetails(id) {
    const [orderRes, itemsRes, historyRes, paymentRes] = await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      supabase.from("payments").select("*").eq("order_id", id).maybeSingle()
    ]);
    if (orderRes.error) throw orderRes.error;
    if (!orderRes.data) return null;
    const order = orderRes.data;
    const items = itemsRes.data || [];
    const history = historyRes.data || [];
    const payment = paymentRes.data || null;
    const itemIds = items.map((i) => i.id);
    let addons = [];
    if (itemIds.length > 0) {
      const { data: addonsData } = await supabase.from("order_item_addons").select("*").in("order_item_id", itemIds);
      addons = addonsData || [];
    }
    let customer = null;
    if (order.customer_id) {
      const { data: customerData } = await supabase.from("profiles").select("*").eq("id", order.customer_id).maybeSingle();
      customer = customerData || null;
    }
    let address = null;
    if (order.address_id) {
      const { data: addressData } = await supabase.from("addresses").select("*").eq("id", order.address_id).maybeSingle();
      address = addressData || null;
    }
    const itemsWithAddons = items.map((item) => ({
      ...item,
      addons: addons.filter((a) => a.order_item_id === item.id)
    }));
    return {
      order,
      customer,
      address,
      items: itemsWithAddons,
      status_history: history,
      payment
    };
  }
  async updateOrderStatus(id, status) {
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single();
    if (error) {
      throw error;
    }
    return data;
  }
};

// src/modules/payments/payments.repository.ts
var PaymentsRepository = class {
  async createPayment(data) {
    const { data: created, error } = await supabase.from("payments").insert({
      order_id: data.order_id,
      provider: data.provider,
      external_id: data.external_id || null,
      status: data.status,
      qr_code_pix: data.qr_code_pix || null
    }).select().single();
    if (error) {
      throw error;
    }
    return created;
  }
  async findByOrderId(orderId) {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
  async findByExternalId(externalId) {
    const { data, error } = await supabase.from("payments").select("*").eq("external_id", externalId).maybeSingle();
    if (error) {
      throw error;
    }
    return data || null;
  }
  async markAsPaid(paymentId) {
    const { data, error } = await supabase.from("payments").update({
      status: "PAID",
      paid_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", paymentId).select().single();
    if (error) {
      throw error;
    }
    return data;
  }
};

// src/shared/utils/pix.ts
function calculateCRC16(str) {
  let crc = 65535;
  const polynomial = 4129;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 32768) !== 0) {
        crc = (crc << 1 ^ polynomial) & 65535;
      } else {
        crc = crc << 1 & 65535;
      }
    }
  }
  return (crc & 65535).toString(16).toUpperCase().padStart(4, "0");
}
function formatTLV(id, value) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}
function generatePixCopiaECola(options) {
  const {
    pixKey,
    merchantName,
    merchantCity = "SAO PAULO",
    amount,
    txId,
    description = ""
  } = options;
  const cleanName = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25).toUpperCase();
  const cleanCity = merchantCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15).toUpperCase();
  const cleanTxId = (txId || "***").replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) || "***";
  const payloadFormat = formatTLV("00", "01");
  const gui = formatTLV("00", "br.gov.bcb.pix");
  const key = formatTLV("01", pixKey);
  const desc = description ? formatTLV("02", description.substring(0, 40)) : "";
  const merchantAccountInfo = formatTLV("26", `${gui}${key}${desc}`);
  const merchantCategory = formatTLV("52", "0000");
  const currency = formatTLV("53", "986");
  const amountStr = amount.toFixed(2);
  const transactionAmount = formatTLV("54", amountStr);
  const countryCode = formatTLV("58", "BR");
  const merchant = formatTLV("59", cleanName);
  const city = formatTLV("60", cleanCity);
  const referenceLabel = formatTLV("05", cleanTxId);
  const additionalData = formatTLV("62", referenceLabel);
  const payloadWithoutCRC = `${payloadFormat}${merchantAccountInfo}${merchantCategory}${currency}${transactionAmount}${countryCode}${merchant}${city}${additionalData}6304`;
  const crc = calculateCRC16(payloadWithoutCRC);
  return `${payloadWithoutCRC}${crc}`;
}

// src/modules/orders/orders.service.ts
var OrdersService = class {
  constructor(ordersRepository = new OrdersRepository(), menuRepository = new MenuRepository(), deliveryZoneRepository = new DeliveryZoneRepository(), settingsRepository = new SettingsRepository(), paymentsRepository = new PaymentsRepository()) {
    this.ordersRepository = ordersRepository;
    this.menuRepository = menuRepository;
    this.deliveryZoneRepository = deliveryZoneRepository;
    this.settingsRepository = settingsRepository;
    this.paymentsRepository = paymentsRepository;
  }
  ordersRepository;
  menuRepository;
  deliveryZoneRepository;
  settingsRepository;
  paymentsRepository;
  async createOrder(input) {
    const customer = await this.ordersRepository.findOrCreateCustomer({
      id: input.customer.id,
      full_name: input.customer.full_name,
      phone: input.customer.phone
    });
    let addressId = null;
    let deliveryFee = 0;
    if (input.delivery_type === "DELIVERY") {
      let neighborhood = "";
      if (input.address_id) {
        const existingAddress = await this.ordersRepository.getAddressById(input.address_id);
        if (!existingAddress) {
          throw new NotFoundError("Endere\xE7o informado n\xE3o encontrado.");
        }
        addressId = existingAddress.id;
        neighborhood = existingAddress.neighborhood;
      } else if (input.address) {
        const createdAddress = await this.ordersRepository.createAddress({
          user_id: customer.id,
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
          zip_code: input.address.zip_code,
          reference_point: input.address.reference_point
        });
        addressId = createdAddress.id;
        neighborhood = createdAddress.neighborhood;
      }
      const zone = await this.deliveryZoneRepository.findByNeighborhood(neighborhood);
      if (!zone) {
        throw new BadRequestError(
          `Infelizmente n\xE3o realizamos entregas no bairro "${neighborhood}". Por favor, selecione a op\xE7\xE3o de Retirada (TAKEOUT).`
        );
      }
      deliveryFee = Number(zone.delivery_fee);
    }
    const menuItemIds = Array.from(new Set(input.items.map((i) => i.menu_item_id)));
    const allAddonIds = Array.from(
      new Set(input.items.flatMap((i) => i.addon_ids || []))
    );
    const [dbMenuItems, dbAddons] = await Promise.all([
      this.menuRepository.findItemsByIds(menuItemIds),
      this.menuRepository.findAddonsByIds(allAddonIds)
    ]);
    const menuItemsMap = new Map(dbMenuItems.map((item) => [item.id, item]));
    const addonsMap = new Map(dbAddons.map((addon) => [addon.id, addon]));
    for (const itemId of menuItemIds) {
      const item = menuItemsMap.get(itemId);
      if (!item) {
        throw new BadRequestError(`Item do card\xE1pio n\xE3o encontrado: ${itemId}`);
      }
      if (!item.is_available) {
        throw new BadRequestError(`O item "${item.name}" est\xE1 temporariamente esgotado.`);
      }
    }
    for (const addonId of allAddonIds) {
      const addon = addonsMap.get(addonId);
      if (!addon) {
        throw new BadRequestError(`Adicional n\xE3o encontrado: ${addonId}`);
      }
      if (!addon.is_available) {
        throw new BadRequestError(`O adicional "${addon.name}" est\xE1 indispon\xEDvel.`);
      }
    }
    let subtotal = 0;
    const preparedItems = input.items.map((reqItem) => {
      const dbItem = menuItemsMap.get(reqItem.menu_item_id);
      const unitPrice = Number(dbItem.price);
      const itemAddons = (reqItem.addon_ids || []).map((addonId) => {
        const dbAddon = addonsMap.get(addonId);
        return {
          addon_id: dbAddon.id,
          addon_name: dbAddon.name,
          price: Number(dbAddon.price)
        };
      });
      const addonsTotalPerUnit = itemAddons.reduce((acc, curr) => acc + curr.price, 0);
      const itemTotalPrice = Number(
        ((unitPrice + addonsTotalPerUnit) * reqItem.quantity).toFixed(2)
      );
      subtotal += itemTotalPrice;
      return {
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        option_label: dbItem.option_label,
        day_name: dbItem.day_of_week,
        has_salad: reqItem.has_salad,
        quantity: reqItem.quantity,
        unit_price: unitPrice,
        preferences: reqItem.preferences?.trim() || null,
        total_price: itemTotalPrice,
        addons: itemAddons
      };
    });
    subtotal = Number(subtotal.toFixed(2));
    deliveryFee = Number(deliveryFee.toFixed(2));
    const discount = 0;
    const totalAmount = Number((subtotal + deliveryFee - discount).toFixed(2));
    if (input.payment_method === "CASH_ON_DELIVERY" && input.need_change) {
      if (!input.change_for || input.change_for < totalAmount) {
        throw new BadRequestError(
          `O valor para troco (R$ ${input.change_for?.toFixed(2)}) deve ser maior que o total do pedido (R$ ${totalAmount.toFixed(2)}).`
        );
      }
    }
    const order = await this.ordersRepository.createOrder({
      customer_id: customer.id,
      delivery_type: input.delivery_type,
      address_id: addressId,
      takeout_time: input.delivery_type === "TAKEOUT" ? input.takeout_time || null : null,
      status: "PENDING",
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total_amount: totalAmount,
      payment_method: input.payment_method,
      need_change: input.need_change,
      change_for: input.change_for ? Number(input.change_for) : null,
      notes: input.notes?.trim() || null
    });
    const itemsToInsert = preparedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      option_label: item.option_label,
      day_name: item.day_name,
      has_salad: item.has_salad,
      quantity: item.quantity,
      unit_price: item.unit_price,
      preferences: item.preferences,
      total_price: item.total_price
    }));
    const insertedItems = await this.ordersRepository.createOrderItems(itemsToInsert);
    const addonsToInsert = [];
    insertedItems.forEach((insertedItem, index) => {
      const originalItem = preparedItems[index];
      if (originalItem && originalItem.addons.length > 0) {
        originalItem.addons.forEach((addon) => {
          addonsToInsert.push({
            order_item_id: insertedItem.id,
            addon_id: addon.addon_id,
            addon_name: addon.addon_name,
            price: addon.price
          });
        });
      }
    });
    if (addonsToInsert.length > 0) {
      await this.ordersRepository.createOrderItemAddons(addonsToInsert);
    }
    await this.ordersRepository.createOrderStatusHistory({
      order_id: order.id,
      from_status: null,
      to_status: "PENDING",
      notes: "Pedido criado com sucesso pelo cliente"
    });
    let pixPayment = null;
    if (input.payment_method === "PIX") {
      const settings = await this.settingsRepository.getSettings();
      const pixKey = settings?.pix_key || "contato@marmitariadodia.com.br";
      const merchantName = settings?.name || "Marmitaria do Dia";
      const txId = `PEDIDO${order.order_number}`;
      const qrCodePix = generatePixCopiaECola({
        pixKey,
        merchantName,
        merchantCity: "SAO PAULO",
        amount: totalAmount,
        txId,
        description: `Marmitaria Pedido #${order.order_number}`
      });
      const paymentRecord = await this.paymentsRepository.createPayment({
        order_id: order.id,
        provider: "PIX_BACEN",
        external_id: txId,
        status: "PENDING",
        qr_code_pix: qrCodePix
      });
      pixPayment = {
        id: paymentRecord.id,
        status: paymentRecord.status,
        provider: paymentRecord.provider,
        qr_code_pix: qrCodePix,
        pix_key: pixKey,
        tx_id: txId
      };
    }
    return {
      id: order.id,
      order_number: order.order_number,
      order_number_formatted: `#${order.order_number}`,
      status: order.status,
      delivery_type: order.delivery_type,
      payment_method: order.payment_method,
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.delivery_fee),
      discount: Number(order.discount),
      total_amount: Number(order.total_amount),
      customer: {
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone
      },
      payment: pixPayment
    };
  }
  async getOrderById(id) {
    const orderDetails = await this.ordersRepository.getOrderCompleteDetails(id);
    if (!orderDetails) {
      throw new NotFoundError(`Pedido com ID "${id}" n\xE3o encontrado.`);
    }
    return {
      id: orderDetails.order.id,
      order_number: orderDetails.order.order_number,
      order_number_formatted: `#${orderDetails.order.order_number}`,
      status: orderDetails.order.status,
      delivery_type: orderDetails.order.delivery_type,
      takeout_time: orderDetails.order.takeout_time,
      payment_method: orderDetails.order.payment_method,
      need_change: orderDetails.order.need_change,
      change_for: orderDetails.order.change_for ? Number(orderDetails.order.change_for) : null,
      notes: orderDetails.order.notes,
      subtotal: Number(orderDetails.order.subtotal),
      delivery_fee: Number(orderDetails.order.delivery_fee),
      discount: Number(orderDetails.order.discount),
      total_amount: Number(orderDetails.order.total_amount),
      created_at: orderDetails.order.created_at,
      updated_at: orderDetails.order.updated_at,
      customer: orderDetails.customer ? {
        id: orderDetails.customer.id,
        full_name: orderDetails.customer.full_name,
        phone: orderDetails.customer.phone
      } : null,
      address: orderDetails.address ? {
        id: orderDetails.address.id,
        street: orderDetails.address.street,
        number: orderDetails.address.number,
        complement: orderDetails.address.complement,
        neighborhood: orderDetails.address.neighborhood,
        city: orderDetails.address.city,
        state: orderDetails.address.state,
        zip_code: orderDetails.address.zip_code,
        reference_point: orderDetails.address.reference_point
      } : null,
      items: orderDetails.items.map((item) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        option_label: item.option_label,
        day_name: item.day_name,
        has_salad: item.has_salad,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        preferences: item.preferences,
        total_price: Number(item.total_price),
        addons: item.addons.map((a) => ({
          id: a.addon_id,
          name: a.addon_name,
          price: Number(a.price)
        }))
      })),
      payment: orderDetails.payment ? {
        id: orderDetails.payment.id,
        provider: orderDetails.payment.provider,
        status: orderDetails.payment.status,
        qr_code_pix: orderDetails.payment.qr_code_pix,
        paid_at: orderDetails.payment.paid_at
      } : null,
      status_history: orderDetails.status_history.map((h) => ({
        id: h.id,
        from_status: h.from_status,
        to_status: h.to_status,
        notes: h.notes,
        created_at: h.created_at
      }))
    };
  }
  async updateOrderStatus(id, newStatus, notes) {
    const existingOrder = await this.ordersRepository.findOrderById(id);
    if (!existingOrder) {
      throw new NotFoundError(`Pedido com ID "${id}" n\xE3o encontrado.`);
    }
    const previousStatus = existingOrder.status;
    const updatedOrder = await this.ordersRepository.updateOrderStatus(id, newStatus);
    await this.ordersRepository.createOrderStatusHistory({
      order_id: id,
      from_status: previousStatus,
      to_status: newStatus,
      notes: notes || `Status alterado para ${newStatus} pelo painel da cozinha`
    });
    return {
      id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      order_number_formatted: `#${updatedOrder.order_number}`,
      previous_status: previousStatus,
      current_status: updatedOrder.status,
      updated_at: updatedOrder.updated_at
    };
  }
};

// src/modules/orders/orders.controller.ts
var OrdersController = class {
  constructor(ordersService = new OrdersService()) {
    this.ordersService = ordersService;
  }
  ordersService;
  createOrder = async (request, reply) => {
    const result = await this.ordersService.createOrder(request.body);
    return reply.status(201).send(result);
  };
  getOrderById = async (request, reply) => {
    const { id } = request.params;
    const result = await this.ordersService.getOrderById(id);
    return reply.status(200).send(result);
  };
  updateOrderStatus = async (request, reply) => {
    const { id } = request.params;
    const { status, notes } = request.body;
    const result = await this.ordersService.updateOrderStatus(id, status, notes);
    return reply.status(200).send(result);
  };
};

// src/modules/orders/orders.schema.ts
var import_zod6 = require("zod");
var orderCustomerSchema = import_zod6.z.object({
  id: import_zod6.z.string().uuid().optional(),
  full_name: import_zod6.z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: import_zod6.z.string().min(8, "Telefone inv\xE1lido")
});
var orderAddressSchema = import_zod6.z.object({
  street: import_zod6.z.string().min(2, "Rua \xE9 obrigat\xF3ria"),
  number: import_zod6.z.string().min(1, "N\xFAmero \xE9 obrigat\xF3rio"),
  complement: import_zod6.z.string().nullable().optional(),
  neighborhood: import_zod6.z.string().min(2, "Bairro \xE9 obrigat\xF3rio"),
  city: import_zod6.z.string().default("S\xE3o Paulo"),
  state: import_zod6.z.string().default("SP"),
  zip_code: import_zod6.z.string().nullable().optional(),
  reference_point: import_zod6.z.string().nullable().optional()
});
var orderItemInputSchema = import_zod6.z.object({
  menu_item_id: import_zod6.z.string().uuid("ID do prato ou bebida inv\xE1lido"),
  quantity: import_zod6.z.number().int().positive("Quantidade deve ser maior que zero").default(1),
  has_salad: import_zod6.z.boolean().default(true),
  preferences: import_zod6.z.string().max(255).nullable().optional(),
  addon_ids: import_zod6.z.array(import_zod6.z.string().uuid()).optional().default([])
});
var createOrderInputSchema = import_zod6.z.object({
  customer: orderCustomerSchema,
  delivery_type: import_zod6.z.enum(["DELIVERY", "TAKEOUT"]),
  address_id: import_zod6.z.string().uuid().optional(),
  address: orderAddressSchema.optional(),
  takeout_time: import_zod6.z.string().optional(),
  items: import_zod6.z.array(orderItemInputSchema).min(1, "O pedido deve conter ao menos 1 item"),
  payment_method: import_zod6.z.enum(["PIX", "CREDIT_CARD", "CASH_ON_DELIVERY", "CARD_ON_DELIVERY"]),
  need_change: import_zod6.z.boolean().default(false),
  change_for: import_zod6.z.number().positive().nullable().optional(),
  notes: import_zod6.z.string().max(500).nullable().optional()
}).superRefine((data, ctx) => {
  if (data.delivery_type === "DELIVERY") {
    if (!data.address_id && !data.address) {
      ctx.addIssue({
        code: import_zod6.z.ZodIssueCode.custom,
        message: "Para entrega (DELIVERY), informe um address_id ou preencha o objeto address",
        path: ["address"]
      });
    }
  }
  if (data.payment_method === "CASH_ON_DELIVERY" && data.need_change) {
    if (!data.change_for) {
      ctx.addIssue({
        code: import_zod6.z.ZodIssueCode.custom,
        message: "Informe o valor para troco em change_for quando need_change for verdadeiro",
        path: ["change_for"]
      });
    }
  }
});
var updateOrderStatusInputSchema = import_zod6.z.object({
  status: import_zod6.z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PREPARATION",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELED"
  ]),
  notes: import_zod6.z.string().max(255).optional()
});
var orderDetailParamsSchema = import_zod6.z.object({
  id: import_zod6.z.string().uuid("ID do pedido inv\xE1lido")
});

// src/modules/orders/orders.routes.ts
async function ordersRoutes(app) {
  const controller = new OrdersController();
  app.withTypeProvider().post(
    "/orders",
    {
      schema: {
        tags: ["Pedidos & Checkout"],
        summary: "Criar novo pedido de marmitex",
        description: "Recebe o pedido com dados do cliente, itens com prefer\xEAncias e adicionais, endere\xE7o ou retirada, forma de pagamento e calcula o total estritamente no servidor.",
        body: createOrderInputSchema
      }
    },
    controller.createOrder
  );
  app.withTypeProvider().get(
    "/orders/:id",
    {
      schema: {
        tags: ["Pedidos & Checkout"],
        summary: "Obter detalhes completos do pedido",
        description: "Retorna o pedido com seus itens, adicionais, endere\xE7o de entrega, pagamento e hist\xF3rico de status.",
        params: orderDetailParamsSchema
      }
    },
    controller.getOrderById
  );
  app.withTypeProvider().patch(
    "/orders/:id/status",
    {
      schema: {
        tags: ["Pedidos & Backoffice"],
        summary: "Atualizar status do pedido (Painel da Cozinha)",
        description: "Endpoint administrativo/backoffice para atualizar o status do pedido (ex: CONFIRMED, IN_PREPARATION, OUT_FOR_DELIVERY, DELIVERED, CANCELED).",
        params: orderDetailParamsSchema,
        body: updateOrderStatusInputSchema
      }
    },
    controller.updateOrderStatus
  );
}

// src/modules/payments/payments.service.ts
var PaymentsService = class {
  constructor(paymentsRepository = new PaymentsRepository(), ordersRepository = new OrdersRepository()) {
    this.paymentsRepository = paymentsRepository;
    this.ordersRepository = ordersRepository;
  }
  paymentsRepository;
  ordersRepository;
  async processWebhook(payload, rawBody) {
    const externalId = payload.external_id || payload.tx_id;
    const orderId = payload.order_id;
    let payment = null;
    if (externalId) {
      payment = await this.paymentsRepository.findByExternalId(externalId);
    }
    if (!payment && orderId) {
      payment = await this.paymentsRepository.findByOrderId(orderId);
    }
    if (!payment) {
      const anyBody = rawBody;
      const nestedId = anyBody?.data?.id;
      if (typeof nestedId === "string" || typeof nestedId === "number") {
        payment = await this.paymentsRepository.findByExternalId(String(nestedId));
      }
    }
    if (!payment) {
      throw new NotFoundError(
        "Pagamento correspondente n\xE3o foi encontrado para os dados informados no webhook."
      );
    }
    const updatedPayment = await this.paymentsRepository.markAsPaid(payment.id);
    const order = await this.ordersRepository.findOrderById(payment.order_id);
    if (!order) {
      throw new NotFoundError(`Pedido com ID "${payment.order_id}" n\xE3o encontrado.`);
    }
    if (order.status === "PENDING") {
      await this.ordersRepository.updateOrderStatus(order.id, "CONFIRMED");
      await this.ordersRepository.createOrderStatusHistory({
        order_id: order.id,
        from_status: "PENDING",
        to_status: "CONFIRMED",
        notes: "Pagamento confirmado automaticamente via Webhook do Gateway"
      });
    }
    return {
      success: true,
      message: "Pagamento confirmado e pedido atualizado para CONFIRMED com sucesso.",
      order_id: order.id,
      order_number: order.order_number,
      payment_status: updatedPayment.status
    };
  }
};

// src/modules/payments/payments.controller.ts
var PaymentsController = class {
  constructor(paymentsService = new PaymentsService()) {
    this.paymentsService = paymentsService;
  }
  paymentsService;
  handleWebhook = async (request, reply) => {
    const result = await this.paymentsService.processWebhook(
      request.body,
      request.body
    );
    return reply.status(200).send(result);
  };
};

// src/modules/payments/payments.schema.ts
var import_zod7 = require("zod");
var paymentWebhookSchema = import_zod7.z.object({
  event: import_zod7.z.string().optional(),
  order_id: import_zod7.z.string().uuid().optional(),
  external_id: import_zod7.z.string().optional(),
  tx_id: import_zod7.z.string().optional(),
  status: import_zod7.z.string().optional(),
  provider: import_zod7.z.string().optional()
});

// src/modules/payments/payments.routes.ts
async function paymentsRoutes(app) {
  const controller = new PaymentsController();
  app.withTypeProvider().post(
    "/payments/webhook",
    {
      schema: {
        tags: ["Pagamentos & Webhook"],
        summary: "Webhook de confirma\xE7\xE3o de pagamento",
        description: "Recebe notifica\xE7\xE3o de pagamento do gateway (Mercado Pago, Asaas, etc.), atualiza o status do pagamento para PAID e o status do pedido para CONFIRMED.",
        body: paymentWebhookSchema
      }
    },
    controller.handleWebhook
  );
}

// src/app.ts
function buildApp() {
  const app = (0, import_fastify.default)({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  }).withTypeProvider();
  app.setValidatorCompiler(import_fastify_type_provider_zod.validatorCompiler);
  app.setSerializerCompiler(import_fastify_type_provider_zod.serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.register(import_cors.default, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  });
  app.register(import_swagger.default, {
    openapi: {
      info: {
        title: "Marmitaria do Dia API",
        description: "API RESTful de alta performance para o aplicativo de delivery de marmitas (Android) e painel web da cozinha (Backoffice). Conectada diretamente ao Supabase.",
        version: "1.0.0",
        contact: {
          name: "Suporte Marmitaria do Dia",
          email: "suporte@marmitariadodia.com.br"
        }
      },
      servers: [
        {
          url: "/",
          description: "Servidor Atual (Auto-detect)"
        }
      ],
      tags: [
        { name: "Card\xE1pio", description: "Endpoints para consulta do card\xE1pio di\xE1rio e semanal" },
        { name: "Configura\xE7\xF5es", description: "Informa\xE7\xF5es do restaurante e hor\xE1rios de atendimento" },
        { name: "Taxas e Bairros", description: "Zonas de entrega e c\xE1lculo de frete" },
        { name: "Pedidos & Checkout", description: "Cria\xE7\xE3o e consulta detalhada de pedidos" },
        { name: "Pedidos & Backoffice", description: "Opera\xE7\xF5es de atualiza\xE7\xE3o de status para a cozinha" },
        { name: "Pagamentos & Webhook", description: "Webhooks e transa\xE7\xF5es de pagamento via PIX/Gateway" }
      ]
    },
    transform: import_fastify_type_provider_zod.jsonSchemaTransform
  });
  app.register(import_swagger_ui.default, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true
    }
  });
  app.get("/", async (_request, reply) => {
    return reply.redirect("/docs", 302);
  });
  app.get("/favicon.ico", async (_request, reply) => {
    return reply.status(204).send();
  });
  app.get("/health", async () => {
    return {
      status: "OK",
      service: "marmitex-backend",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    };
  });
  app.register(
    async (apiV1) => {
      await apiV1.register(menuRoutes);
      await apiV1.register(settingsRoutes);
      await apiV1.register(deliveryZoneRoutes);
      await apiV1.register(ordersRoutes);
      await apiV1.register(paymentsRoutes);
    },
    { prefix: "/api/v1" }
  );
  return app;
}

// src/serverless.ts
var appPromise = null;
async function getFastifyApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = buildApp();
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}
async function handler(req, res) {
  const app = await getFastifyApp();
  app.server.emit("request", req, res);
}
