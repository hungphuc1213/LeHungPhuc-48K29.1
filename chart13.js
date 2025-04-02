document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 150, bottom: 100, left: 60 },
            width = 900,
            height = 500;

        // Hàm ánh xạ Mã PKKH sang Phân khúc
        const mapPhanKhuc = (maPKKH) => {
            if (["A1", "A2", "A3"].includes(maPKKH)) return "Chăm sóc & Thưởng thức";
            if (["B1", "B2", "B3"].includes(maPKKH)) return "Hỗ trợ chữa bệnh & Phòng ngừa";
            if (["C1", "C2", "C3"].includes(maPKKH)) return "Mua thử & Quà tặng";
            return "Không xác định";
        };

        // Chuyển đổi dữ liệu và thêm cột Phân khúc
        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
            d["Mã PKKH"] = d["Mã PKKH"] || "Không xác định";
            d["Phân khúc"] = mapPhanKhuc(d["Mã PKKH"]);
        });

        // Chuẩn hóa dữ liệu
        const data1 = data.map(d => ({
            "Mã đơn hàng": d["Mã đơn hàng"],
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Thành tiền": d["Thành tiền"],
            "SL": d["SL"],
            "Phân khúc": d["Phân khúc"]
        }));

        // Tổng số đơn hàng duy nhất theo từng phân khúc
        const totalOrdersByPhanKhuc = Array.from(
            d3.group(data1, d => d["Phân khúc"]),
            ([key, values]) => ({
                "Phân khúc": key,
                "TotalOrders": [...new Set(values.map(d => d["Mã đơn hàng"]))].length
            })
        );

        // Tổng hợp dữ liệu theo Nhóm hàng và Phân khúc
        const aggregatedData = Array.from(
            d3.group(data1, d => d["Nhóm hàng"], d => d["Phân khúc"]),
            ([nhomHang, pkMap]) => ({
                "Nhóm hàng": nhomHang,
                "Values": Array.from(pkMap, ([phanKhuc, values]) => {
                    const totalOrders = totalOrdersByPhanKhuc.find(t => t["Phân khúc"] === phanKhuc)["TotalOrders"];
                    return {
                        "Phân khúc": phanKhuc,
                        "Xác suất bán": ([...new Set(values.map(d => d["Mã đơn hàng"]))].length / totalOrders) * 100
                    };
                })
            })
        );

        // Khởi tạo SVG
        const svg = d3.select("#chart7")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Thang đo
        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Nhóm hàng"]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d3.max(d["Values"], v => v["Xác suất bán"]))])
            .nice()
            .range([height, 0]);

        // Tạo thang đo phụ cho các cột trong mỗi Nhóm hàng
        const xSubgroup = d3.scaleBand()
            .domain([...new Set(aggregatedData.flatMap(d => d["Values"]).map(v => v["Phân khúc"]))])
            .range([0, x.bandwidth()])
            .padding(0.05);

        // Tạo màu sắc dựa trên Phân khúc
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(aggregatedData.flatMap(d => d["Values"]).map(v => v["Phân khúc"]))]);

        // Vẽ các cột
        const bars = chart.selectAll(".bar-group")
            .data(aggregatedData)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => `translate(${x(d["Nhóm hàng"])},0)`);

        bars.selectAll(".bar")
            .data(d => d["Values"])
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xSubgroup(d["Phân khúc"]))
            .attr("y", d => y(d["Xác suất bán"]))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => height - y(d["Xác suất bán"]))
            .attr("fill", d => colorScale(d["Phân khúc"]));

        // Nhãn xác suất bán trên cột
        bars.selectAll(".label")
            .data(d => d["Values"])
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xSubgroup(d["Phân khúc"]) + xSubgroup.bandwidth() / 2)
            .attr("y", d => y(d["Xác suất bán"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${d["Xác suất bán"].toFixed(1)}%`)
            .style("font-size", "10px");

        // Thêm trục X
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)")
            .style("font-size", "11px");

        // Thêm trục Y
        chart.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${d}%`).ticks(6))
            .style("font-size", "11px");

        // Thêm tiêu đề biểu đồ
        svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng theo Nhóm hàng và Phân khúc");

        // Thêm legend dựa trên Phân khúc
        const legend = svg.append("g")
            .attr("transform", `translate(${width + margin.left + 10}, ${margin.top})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(colorScale.domain())
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("rect")
            .attr("x", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => colorScale(d));

        legendItems.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(d => d)
            .style("font-size", "12px");

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});