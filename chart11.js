document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        // **Chuyển dữ liệu thành số**
        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"];
            
            // **Gán giá trị cho cột Phân khúc dựa vào Mã PKKH**
            const phanKhucMap = {
                "A1": "Chăm sóc & Thưởng thức", "A2": "Chăm sóc & Thưởng thức", "A3": "Chăm sóc & Thưởng thức",
                "B1": "Hỗ trợ chữa bệnh & Phòng ngừa", "B2": "Hỗ trợ chữa bệnh & Phòng ngừa", "B3": "Hỗ trợ chữa bệnh & Phòng ngừa",
                "C1": "Mua thử & Quà tặng", "C2": "Mua thử & Quà tặng", "C3": "Mua thử & Quà tặng"
            };
            d["Phân khúc"] = phanKhucMap[d["Mã PKKH"]] || "Khác";
        });

        // **Tính tổng doanh thu theo từng phân khúc**
        const doanhThuPhanKhuc = d3.rollup(
            data,
            v => d3.sum(v, d => d["Thành tiền"]),
            d => d["Phân khúc"]
        );

        // **Chuyển dữ liệu về mảng**
        const doanhThuArray = Array.from(doanhThuPhanKhuc, ([key, value]) => ({ PhanKhuc: key, DoanhThu: value }));

        // **Thiết lập kích thước SVG**
        const width = 800, height = 500, margin = { top: 60, right: 150, bottom: 50, left: 200 };

        const svg = d3.select("#chart13")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // **Tạo scale**
        const yScale = d3.scaleBand()
            .domain(doanhThuArray.map(d => d.PhanKhuc))
            .range([0, height - margin.top - margin.bottom])
            .padding(0.2);

        const xScale = d3.scaleLinear()
            .domain([0, Math.ceil(d3.max(doanhThuArray, d => d.DoanhThu) / 200000000) * 200000000])
            .nice()
            .range([0, width - margin.left - margin.right]);

        const colorScale = d3.scaleOrdinal()
            .domain(doanhThuArray.map(d => d.PhanKhuc))
            .range(["#007bff", "#28a745", "#dc3545"]);

        // **Vẽ thanh ngang**
        svg.selectAll(".bar")
            .data(doanhThuArray)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => yScale(d.PhanKhuc))
            .attr("x", 0)
            .attr("width", d => xScale(d.DoanhThu))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.PhanKhuc));

        // **Hiển thị nhãn giá trị trên mỗi thanh**
        svg.selectAll(".label")
            .data(doanhThuArray)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.DoanhThu) + 5)
            .attr("y", d => yScale(d.PhanKhuc) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(",.0f")(d.DoanhThu))
            .attr("fill", "black")
            .attr("font-size", "14px");

        // **Thêm trục Y (danh sách phân khúc)**
        svg.append("g").call(d3.axisLeft(yScale));

        // **Thêm trục X với bước nhảy 200M**
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickValues(d3.range(0, xScale.domain()[1] + 1, 200000000))
            .tickFormat(d => `${d / 1000000}M`));

        // **Thêm tiêu đề**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "#007bff")
            .text("Doanh số bán hàng theo từng Phân khúc");
    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
});
